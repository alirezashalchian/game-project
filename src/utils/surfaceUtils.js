import * as THREE from "three";

// Cached surface vectors to reduce memory allocation
export const SURFACE_BASE_VECTORS = {
  bottom: {
    up: new THREE.Vector3(0, 1, 0),
    forward: new THREE.Vector3(0, 0, 1),
    right: new THREE.Vector3(1, 0, 0),
  },
  top: {
    up: new THREE.Vector3(0, -1, 0),
    forward: new THREE.Vector3(0, 0, -1),
    right: new THREE.Vector3(1, 0, 0),
  },
  front: {
    up: new THREE.Vector3(0, 0, -1),
    forward: new THREE.Vector3(0, 1, 0),
    right: new THREE.Vector3(1, 0, 0),
  },
  back: {
    up: new THREE.Vector3(0, 0, 1),
    forward: new THREE.Vector3(0, -1, 0),
    right: new THREE.Vector3(1, 0, 0),
  },
  right: {
    up: new THREE.Vector3(-1, 0, 0),
    forward: new THREE.Vector3(0, 0, 1),
    right: new THREE.Vector3(0, 1, 0),
  },
  left: {
    up: new THREE.Vector3(1, 0, 0),
    forward: new THREE.Vector3(0, 0, 1),
    right: new THREE.Vector3(0, -1, 0),
  },
};

export const SURFACE_UP_VECTORS = {
  bottom: new THREE.Vector3(0, 1, 0),
  top: new THREE.Vector3(0, -1, 0),
  front: new THREE.Vector3(0, 0, -1),
  back: new THREE.Vector3(0, 0, 1),
  right: new THREE.Vector3(-1, 0, 0),
  left: new THREE.Vector3(1, 0, 0),
};

// Get the "up" vector for a given surface - optimized with cached vectors
export const getSurfaceUpVector = (surface) => {
  return SURFACE_UP_VECTORS[surface] || SURFACE_UP_VECTORS.bottom;
};

// Surface-relative movement helper function - optimized with cached vectors
export const getSurfaceVectors = (surface, horizontalRotation = 0) => {
  const base = SURFACE_BASE_VECTORS[surface];

  if (!base) {
    // Fallback to bottom surface if invalid surface provided
    return SURFACE_BASE_VECTORS.bottom;
  }

  if (horizontalRotation === 0) {
    // No rotation needed - return cached vectors directly (no cloning required)
    return {
      up: base.up,
      forward: base.forward,
      right: base.right,
    };
  }

  // Only clone when we need to apply rotation to avoid modifying cached vectors
  const up = base.up; // Up vector never changes, no need to clone
  const forward = base.forward.clone(); // Clone because we'll modify with rotation
  const right = base.right.clone(); // Clone because we'll modify with rotation

  // Apply horizontal rotation to forward and right vectors
  const rotationQuaternion = new THREE.Quaternion();
  rotationQuaternion.setFromAxisAngle(up, horizontalRotation);

  forward.applyQuaternion(rotationQuaternion);
  right.applyQuaternion(rotationQuaternion);

  return { up, forward, right };
};

// Get surface reference point (center of the surface in world coordinates)
export const getSurfaceReferencePoint = (room, surface) => {
  if (!room) return new THREE.Vector3(0, 0, 0);

  const roomPos = new THREE.Vector3(...room.position);
  const halfSize = room.innerSize / 2;

  switch (surface) {
    case "bottom":
      return new THREE.Vector3(roomPos.x, roomPos.y - halfSize, roomPos.z);
    case "top":
      return new THREE.Vector3(roomPos.x, roomPos.y + halfSize, roomPos.z);
    case "front":
      return new THREE.Vector3(roomPos.x, roomPos.y, roomPos.z + halfSize);
    case "back":
      return new THREE.Vector3(roomPos.x, roomPos.y, roomPos.z - halfSize);
    case "right":
      return new THREE.Vector3(roomPos.x + halfSize, roomPos.y, roomPos.z);
    case "left":
      return new THREE.Vector3(roomPos.x - halfSize, roomPos.y, roomPos.z);
    default:
      return roomPos;
  }
};

// Function to determine which surface is the floor based on gravity direction
export const getFloorSurfaceFromGravity = (gravity) => {
  const [x, y, z] = gravity;

  // Check which component has the highest absolute value (dominant direction)
  const absX = Math.abs(x);
  const absY = Math.abs(y);
  const absZ = Math.abs(z);

  if (absY > absX && absY > absZ) {
    // Y-axis dominant
    return y < 0 ? "bottom" : "top";
  } else if (absX > absY && absX > absZ) {
    // X-axis dominant
    return x < 0 ? "left" : "right";
  } else if (absZ > absY && absZ > absX) {
    // Z-axis dominant
    return z < 0 ? "back" : "front";
  }

  // Default fallback
  return "bottom";
};

// Convert world coordinates to surface-relative coordinates
export const worldToSurfaceCoords = (worldPos, surface, room) => {
  const surfacePoint = getSurfaceReferencePoint(room, surface);
  const surfaceUp = getSurfaceUpVector(surface);
  const { forward, right } = getSurfaceVectors(surface, 0);

  // Calculate offset from surface reference point
  const offset = new THREE.Vector3(...worldPos).sub(surfacePoint);

  // Project onto surface plane
  const surfaceX = offset.dot(right);
  const surfaceY = offset.dot(forward);
  const surfaceZ = offset.dot(surfaceUp);

  return { x: surfaceX, y: surfaceY, z: surfaceZ };
};

// Convert surface-relative coordinates back to world coordinates
export const surfaceToWorldCoords = (surfacePos, surface, room) => {
  const surfacePoint = getSurfaceReferencePoint(room, surface);
  const surfaceUp = getSurfaceUpVector(surface);
  const { forward, right } = getSurfaceVectors(surface, 0);

  const worldPos = surfacePoint.clone();
  worldPos.addScaledVector(right, surfacePos.x);
  worldPos.addScaledVector(forward, surfacePos.y);
  worldPos.addScaledVector(surfaceUp, surfacePos.z);

  return worldPos;
};

// Helper function to calculate target quaternion for new surface
export const calculateTargetQuaternion = (newSurface) => {
  const targetQuaternion = new THREE.Quaternion();

  switch (newSurface) {
    // -Y surface = bottom
    case "bottom": // Floor - no rotation needed
      targetQuaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);
      break;
    // +Y surface = top
    case "top": // Ceiling - rotate 180 degrees around X axis
      targetQuaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
      break;
    // +Z surface = front
    case "front": // Front wall - rotate 90 degrees around X axis
      targetQuaternion.setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        -Math.PI / 2
      );
      break;
    // -Z surface = back
    case "back": // Back wall - rotate 90 degrees around X axis (opposite direction)
      targetQuaternion.setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        Math.PI / 2
      );
      break;
    // +X surface = left
    case "left": // left wall - rotate 90 degrees around Z axis
      targetQuaternion.setFromAxisAngle(
        new THREE.Vector3(0, 0, 1),
        -Math.PI / 2
      );
      break;
    // -X surface = right
    case "right": // Right wall - rotate 90 degrees around Z axis (opposite direction)
      targetQuaternion.setFromAxisAngle(
        new THREE.Vector3(0, 0, 1),
        Math.PI / 2
      );
      break;
    default:
      targetQuaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);
  }

  return targetQuaternion;
}; 
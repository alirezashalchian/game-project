import { useRef, useEffect, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls, useAnimations } from "@react-three/drei";
import { RigidBody, CapsuleCollider, useRapier } from "@react-three/rapier";
import { useRoom } from "./RoomContext";
import * as THREE from "three";
import { calculateRoomPosition } from "../utils/roomUtils";
import { roomConfig } from "./Room/roomConfig";

export default function Mage() {
  const mage = useGLTF("./models/characters/Mage.glb");
  const animations = useAnimations(mage.animations, mage.scene);
  const { updateCurrentRoom, getCurrentRoomCoords } = useRoom();

  const rigidBodyRef = useRef();
  const mageRef = useRef();
  const capsuleRef = useRef();
  const currentActionRef = useRef(null);

  // Get keyboard controls using drei's system
  const [subscribeKeys, getKeys] = useKeyboardControls();

  // Get rapier physics world
  const { rapier, world } = useRapier();
  // Character dimensions
  const capsuleHalfHeight = 0.25;
  const capsuleRadius = 0.5;
  const modelYOffset = -0.75;

  // Get initial position in the center of room [4,4,4]
  const centerCoords = [4, 4, 4]; // Center of the 9x9x9 complex
  const roomPosition = calculateRoomPosition(centerCoords);

  // Place character slightly off center on the floor to avoid hole in middle
  const floorHeight = roomPosition[1] - roomConfig.innerSize / 2;
  const initialY = floorHeight + capsuleRadius + capsuleHalfHeight + 0.5 + 1;
  // Offset character 2 units from center to avoid central hole
  const initialPosition = [roomPosition[0] + 2, initialY, roomPosition[2] + 2];

  // Camera settings
  const cameraDistance = 5;
  const cameraHeight = 3;
  const cameraLookAtHeight = 1.5;
  const cameraCollisionOffset = 0.1; // Distance to keep from walls

  // Smoothed camera values
  const [smoothedCameraPosition] = useState(
    () => new THREE.Vector3(0, cameraHeight, -cameraDistance)
  );
  const [smoothedCameraTarget] = useState(() => new THREE.Vector3());

  // Gravity state
  const [currentGravity, setCurrentGravity] = useState([0, -9.8, 0]);
  const [wallTouchData, setWallTouchData] = useState(null);
  // Track which surface is currently the floor based on gravity direction
  const [currentFloorSurface, setCurrentFloorSurface] = useState("bottom");

  // Debouncing for wall touch to prevent rapid switching
  const wallTouchTimeout = useRef(null);
  const lastWallTouchTime = useRef(0);
  const WALL_TOUCH_DEBOUNCE_TIME = 200; // 200ms debounce

  // Character state - UPDATED to use quaternions
  const characterState = useRef({
    // Replace rotation with quaternion-based rotation
    horizontalRotation: 0, // Keep track of horizontal rotation in radians for camera
    currentHorizontalQuaternion: new THREE.Quaternion(), // Current horizontal rotation as quaternion
    targetHorizontalQuaternion: new THREE.Quaternion(), // Target horizontal rotation
    moveSpeed: 5,
    rotationSpeed: 3,
    jumpForce: 4,
    acceleration: 25,
    deceleration: 8,
    // Surface orientation tracking
    currentSurface: "bottom", // "bottom", "top", "front", "back", "left", "right"
    isTransitioning: false,
    transitionProgress: 0,
    transitionDuration: 1.0,
    // Add surface orientation quaternion
    currentSurfaceQuaternion: new THREE.Quaternion(),
    targetSurfaceQuaternion: new THREE.Quaternion(),
  });

  // Helper function to calculate target quaternion for new surface
  const calculateTargetQuaternion = (newSurface) => {
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

  // Display current room coordinates for debugging
  useEffect(() => {
    const currentCoords = getCurrentRoomCoords();
    console.log("Current room coordinates:", currentCoords);
  }, [getCurrentRoomCoords]);

  // Function to determine which surface is the floor based on gravity direction
  const getFloorSurfaceFromGravity = (gravity) => {
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

  // Update current floor surface whenever gravity changes
  useEffect(() => {
    const newFloorSurface = getFloorSurfaceFromGravity(currentGravity);
    setCurrentFloorSurface(newFloorSurface);
    console.log(`Current floor surface updated to: ${newFloorSurface}`);
  }, [currentGravity]);

  // Cleanup effect for wall touch timeouts
  useEffect(() => {
    return () => {
      if (wallTouchTimeout.current) {
        clearTimeout(wallTouchTimeout.current);
      }
    };
  }, []);

  // Handle wall collision for gravity change
  const handleCollisionEnter = ({ other }) => {
    // Check if we collided with a wall
    if (other.rigidBodyObject?.userData?.isWall) {
      const { wallType, roomId } = other.rigidBodyObject.userData;
      console.log(
        `Collision with wall: ${wallType}, Current floor: ${currentFloorSurface}`
      );

      // Exclude the current floor surface from triggering wall touch
      if (wallType !== currentFloorSurface) {
        const now = Date.now();

        // Clear existing timeout
        if (wallTouchTimeout.current) {
          clearTimeout(wallTouchTimeout.current);
        }

        // Only update if enough time has passed or it's a different wall type
        if (
          now - lastWallTouchTime.current > WALL_TOUCH_DEBOUNCE_TIME ||
          !wallTouchData ||
          wallTouchData.wallType !== wallType
        ) {
          console.log(`Setting wall touch data for: ${wallType}`);
          wallTouchTimeout.current = setTimeout(() => {
            setWallTouchData({ wallType, roomId });
            lastWallTouchTime.current = now;
          }, 50);
        }
      } else {
        console.log(`Wall collision ignored (current floor): ${wallType}`);
      }
    }
  };

  // Handle wall collision exit
  const handleCollisionExit = ({ other }) => {
    // Check if we stopped colliding with a wall
    if (other.rigidBodyObject?.userData?.isWall) {
      const { wallType, roomId } = other.rigidBodyObject.userData;

      // Only clear if this was the active wall touch
      if (
        wallTouchData &&
        wallTouchData.wallType === wallType &&
        wallTouchData.roomId === roomId
      ) {
        if (wallTouchTimeout.current) {
          clearTimeout(wallTouchTimeout.current);
        }

        wallTouchTimeout.current = setTimeout(() => {
          setWallTouchData(null);
        }, 100);
      }
    }
  };

  // Surface-relative movement helper function
  const getSurfaceVectors = (surface, horizontalRotation) => {
    let up = new THREE.Vector3(0, 1, 0);
    let forward = new THREE.Vector3(0, 0, 1);
    let right = new THREE.Vector3(1, 0, 0);

    // Define surface-relative vectors
    switch (surface) {
      case "bottom": // Floor
        up = new THREE.Vector3(0, 1, 0);
        forward = new THREE.Vector3(0, 0, 1);
        right = new THREE.Vector3(1, 0, 0);
        break;
      case "top": // Ceiling
        up = new THREE.Vector3(0, -1, 0);
        forward = new THREE.Vector3(0, 0, -1);
        right = new THREE.Vector3(-1, 0, 0);
        break;
      case "front": // Front wall
        up = new THREE.Vector3(0, 0, 1);
        forward = new THREE.Vector3(0, -1, 0);
        right = new THREE.Vector3(1, 0, 0);
        break;
      case "back": // Back wall
        up = new THREE.Vector3(0, 0, -1);
        forward = new THREE.Vector3(0, 1, 0);
        right = new THREE.Vector3(-1, 0, 0);
        break;
      case "right": // Right wall
        up = new THREE.Vector3(1, 0, 0);
        forward = new THREE.Vector3(0, 0, 1);
        right = new THREE.Vector3(0, -1, 0);
        break;
      case "left": // Left wall
        up = new THREE.Vector3(-1, 0, 0);
        forward = new THREE.Vector3(0, 0, -1);
        right = new THREE.Vector3(0, 1, 0);
        break;
    }

    // Apply horizontal rotation to forward and right vectors
    const rotationQuaternion = new THREE.Quaternion();
    rotationQuaternion.setFromAxisAngle(up, horizontalRotation);

    forward.applyQuaternion(rotationQuaternion);
    right.applyQuaternion(rotationQuaternion);

    return { up, forward, right };
  };

  // Handle gravity change confirmation
  const handleGravityChange = (wallType) => {
    const directions = {
      front: [0, 0, 9.8], // gravity towards front wall
      back: [0, 0, -9.8], // gravity towards back wall
      right: [9.8, 0, 0], // gravity towards right wall
      left: [-9.8, 0, 0], // gravity towards left wall
      top: [0, 9.8, 0], // gravity towards ceiling
    };

    const newGravity = directions[wallType];
    if (newGravity) {
      setCurrentGravity(newGravity);

      // Start surface transition
      const newSurface = wallType;
      const newTargetQuaternion = calculateTargetQuaternion(newSurface);

      // Update surface quaternions
      characterState.current.targetSurfaceQuaternion.copy(newTargetQuaternion);
      characterState.current.currentSurface = newSurface;
      characterState.current.isTransitioning = true;
      characterState.current.transitionProgress = 0;

      console.log(`Starting transition to surface: ${newSurface}`);
    }
    setWallTouchData(null);
  };

  // Subscribe to jump key
  useEffect(() => {
    const unsubscribeJump = subscribeKeys(
      (state) => state.jump,
      (pressed) => {
        if (pressed && rigidBodyRef.current) {
          // Apply jump force on space press
          rigidBodyRef.current.applyImpulse(
            { x: 0, y: characterState.current.jumpForce, z: 0 },
            true
          );
        }
      }
    );

    return () => {
      if (typeof unsubscribeJump === "function") {
        unsubscribeJump();
      }
    };
  }, [subscribeKeys]);

  // Expose gravity functions and wall touch data for external UI
  window.wallTouchData = wallTouchData;
  window.handleGravityChange = handleGravityChange;

  // Function to handle camera collision detection
  const handleCameraCollision = (characterPosition, idealCameraPosition) => {
    // Create ray origin at character position with a slight height adjustment
    const rayOrigin = new THREE.Vector3(
      characterPosition.x,
      characterPosition.y + cameraLookAtHeight,
      characterPosition.z
    );

    // Calculate direction from character to camera
    const rayDirection = new THREE.Vector3();
    rayDirection.subVectors(idealCameraPosition, rayOrigin).normalize();

    // Calculate actual distance to camera
    const distanceToCamera = rayOrigin.distanceTo(idealCameraPosition);

    // Cast ray from character towards ideal camera position
    const ray = new rapier.Ray(
      { x: rayOrigin.x, y: rayOrigin.y, z: rayOrigin.z },
      { x: rayDirection.x, y: rayDirection.y, z: rayDirection.z }
    );

    const hit = world.castRay(ray, distanceToCamera, true);

    // If we hit something, adjust camera position
    if (hit && hit.timeOfImpact < distanceToCamera) {
      // Calculate adjusted position at hit point minus a small offset to avoid clipping
      const adjustedDistance = hit.timeOfImpact - cameraCollisionOffset;

      // Calculate new position
      const adjustedPosition = new THREE.Vector3();
      adjustedPosition.copy(rayOrigin);
      adjustedPosition.addScaledVector(rayDirection, adjustedDistance);

      return adjustedPosition;
    }

    // No collision, return ideal position
    return idealCameraPosition;
  };

  // Function to smoothly play a new animation
  const playAction = (newAction) => {
    if (!newAction || currentActionRef.current === newAction) return;
    if (currentActionRef.current) {
      currentActionRef.current.fadeOut(0.2);
    }
    newAction.reset().fadeIn(0.2).play();
    currentActionRef.current = newAction;
  };

  // Update physics and camera each frame
  useFrame((state, delta) => {
    if (!rigidBodyRef.current || !mageRef.current) return;

    // Get character position for camera positioning
    const position = rigidBodyRef.current.translation();
    const characterPosition = new THREE.Vector3(
      position.x,
      position.y,
      position.z
    );

    // Update current room based on character position
    updateCurrentRoom([position.x, position.y, position.z]);

    const { forward, backward, leftward, rightward } = getKeys();

    // Handle animation switching
    if (forward) {
      playAction(animations.actions.Running_A);
    } else if (backward) {
      playAction(animations.actions.Walking_Backwards);
    } else {
      playAction(animations.actions.Idle);
    }

    // Handle surface transition
    if (characterState.current.isTransitioning) {
      characterState.current.transitionProgress +=
        delta / characterState.current.transitionDuration;

      if (characterState.current.transitionProgress >= 1.0) {
        // Transition complete
        characterState.current.transitionProgress = 1.0;
        characterState.current.isTransitioning = false;
        characterState.current.currentSurfaceQuaternion.copy(
          characterState.current.targetSurfaceQuaternion
        );
      }

      // Smoothly interpolate between current and target surface quaternion
      characterState.current.currentSurfaceQuaternion.slerp(
        characterState.current.targetSurfaceQuaternion,
        characterState.current.transitionProgress
      );
    }

    // Handle horizontal rotation (quaternion-based)
    if (!characterState.current.isTransitioning) {
      let rotationChange = 0;
      if (leftward)
        rotationChange = characterState.current.rotationSpeed * delta;
      if (rightward)
        rotationChange = -characterState.current.rotationSpeed * delta;

      if (rotationChange !== 0) {
        characterState.current.horizontalRotation += rotationChange;

        // Get the surface's up vector for rotation axis
        const { up } = getSurfaceVectors(
          characterState.current.currentSurface,
          0
        );

        // Create new horizontal rotation quaternion
        characterState.current.currentHorizontalQuaternion.setFromAxisAngle(
          up,
          characterState.current.horizontalRotation
        );
      }
    }

    // Calculate final combined quaternion (surface orientation + horizontal rotation)
    const finalQuaternion =
      characterState.current.currentSurfaceQuaternion.clone();
    finalQuaternion.multiply(
      characterState.current.currentHorizontalQuaternion
    );

    // Apply to physics body
    rigidBodyRef.current.setRotation({
      x: finalQuaternion.x,
      y: finalQuaternion.y,
      z: finalQuaternion.z,
      w: finalQuaternion.w,
    });

    // // Apply to visual model
    // mageRef.current.quaternion.copy(finalQuaternion);

    // Movement calculations (only when not transitioning)
    if (!characterState.current.isTransitioning) {
      // Calculate movement direction relative to current surface
      const { forward: surfaceForward } = getSurfaceVectors(
        characterState.current.currentSurface,
        characterState.current.horizontalRotation
      );

      const currentVel = rigidBodyRef.current.linvel();
      const moveDirection = new THREE.Vector3(0, 0, 0);

      if (forward) {
        moveDirection.add(surfaceForward);
      }
      if (backward) {
        moveDirection.sub(surfaceForward);
      }

      // Apply movement (preserve current velocity in gravity direction)
      const targetVelocity = new THREE.Vector3();
      if (moveDirection.length() > 0) {
        moveDirection.normalize();
        moveDirection.multiplyScalar(characterState.current.moveSpeed);
        targetVelocity.copy(moveDirection);
      }

      // Preserve current velocity to maintain gravity/physics
      const currentVelocity = new THREE.Vector3(
        currentVel.x,
        currentVel.y,
        currentVel.z
      );
      const velocityDiff = new THREE.Vector3();
      velocityDiff.subVectors(targetVelocity, currentVelocity);

      const accelerationRate =
        moveDirection.length() > 0
          ? characterState.current.acceleration
          : characterState.current.deceleration;

      velocityDiff.multiplyScalar(accelerationRate * delta);
      rigidBodyRef.current.applyImpulse(
        { x: velocityDiff.x, y: velocityDiff.y, z: velocityDiff.z },
        true
      );
    }

    // Apply gravity force each frame (using current gravity direction)
    rigidBodyRef.current.applyImpulse(
      {
        x: currentGravity[0] * delta,
        y: currentGravity[1] * delta,
        z: currentGravity[2] * delta,
      },
      true
    );

    // Calculate ideal camera position (using horizontal rotation for camera)
    const cameraOffset = new THREE.Vector3(
      -Math.sin(characterState.current.horizontalRotation) * cameraDistance,
      cameraHeight,
      -Math.cos(characterState.current.horizontalRotation) * cameraDistance
    );

    const idealCameraPosition = new THREE.Vector3(
      position.x + cameraOffset.x,
      position.y + cameraOffset.y,
      position.z + cameraOffset.z
    );

    // Check for camera collisions and adjust position if needed
    const collisionAdjustedPosition = handleCameraCollision(
      characterPosition,
      idealCameraPosition
    );

    // Calculate target for camera to look at
    const targetLookAt = new THREE.Vector3(
      position.x,
      position.y + cameraLookAtHeight,
      position.z
    );

    // Smoothly interpolate camera position and target
    smoothedCameraPosition.lerp(collisionAdjustedPosition, 5 * delta);
    smoothedCameraTarget.lerp(targetLookAt, 5 * delta);

    // Update camera
    state.camera.position.copy(smoothedCameraPosition);
    state.camera.lookAt(smoothedCameraTarget);
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={initialPosition}
      enabledRotations={[false, false, false]}
      type="dynamic"
      colliders={false}
      mass={1}
      friction={0.2}
      linearDamping={0.5}
      angularDamping={0.5}
      userData={{ isCharacter: true }}
      onCollisionEnter={handleCollisionEnter}
      onCollisionExit={handleCollisionExit}
    >
      <CapsuleCollider
        ref={capsuleRef}
        args={[capsuleHalfHeight, capsuleRadius]}
      />
      <group ref={mageRef}>
        <primitive
          object={mage.scene}
          scale={0.5}
          position={[0, modelYOffset, 0]}
          // No rotation - inherits from RigidBody (quaternion-based)
        />
      </group>
    </RigidBody>
  );
}

/**
 * Potential issues of the capsule collider not rotating with the visual gltf model:
1. Animation and Model Complexity Issues
Problem: If your character model becomes more complex (non-symmetrical), players will see the visual model rotating but collision detection won't match
Example: A character holding a sword or staff extending forward - visually it rotates, but collision shape stays circular
2. Interaction System Problems.
Problem: Raycast interactions (like object pickup, weapon swinging) will be based on visual rotation, but physics interactions use the non-rotating capsule
Example: Player appears to swing a sword to the right, but collision detection uses the original forward direction
3. Combat/Damage System Issues.
Problem: If you implement directional damage, attack ranges, or shield mechanics, the mismatch becomes problematic
Example: Enemy attacks from the character's visual "back" but hits the circular collider from any direction
4. Advanced Movement Features.
Problem: Features like wall-running, climbing, or directional dodging become harder to implement
Example: Character visually faces a wall to climb it, but physics body has no "front" direction.
 */

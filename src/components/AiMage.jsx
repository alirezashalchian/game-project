import { useRef, useEffect, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls, useAnimations } from "@react-three/drei";
import { RigidBody, CapsuleCollider, useRapier } from "@react-three/rapier";
import { useRoom } from "./RoomContext";
import { useCharacter } from "./CharacterContext";
import * as THREE from "three";
import { calculateRoomPosition } from "../utils/roomUtils";
import { roomConfig } from "./Room/roomConfig";

export default function Mage() {
  const mage = useGLTF("./models/characters/Mage.glb");
  const animations = useAnimations(mage.animations, mage.scene);
  const { updateCurrentRoom, getCurrentRoomCoords } = useRoom();
  const { currentGravity, setCurrentGravity } = useCharacter();

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
  const cameraHeight = 2;
  const cameraLookAtHeight = 1;
  const cameraCollisionOffset = 0.1; // Distance to keep from walls

  // Smoothed camera values
  const [smoothedCameraPosition] = useState(
    () => new THREE.Vector3(0, cameraHeight, -cameraDistance)
  );

  const [smoothedCameraTarget] = useState(() => new THREE.Vector3());

  // Track which surface is currently the floor based on gravity direction
  const [currentFloorSurface, setCurrentFloorSurface] = useState("bottom");

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
    isTransitioning: false,
    transitionProgress: 0,
    transitionDuration: 1.0,
    // Add surface orientation quaternion
    currentSurfaceQuaternion: new THREE.Quaternion(),
    targetSurfaceQuaternion: new THREE.Quaternion(),
    // Camera pause during surface transitions
    cameraPaused: false,
    cameraPauseTimer: 0,
    cameraPauseDuration: 2.0, // 2 seconds
    pausedCameraPosition: new THREE.Vector3(),
    pausedCameraTarget: new THREE.Vector3(),
    pausedCameraUp: new THREE.Vector3(),
    // Gravity change cooldown
    gravityCooldown: false,
    gravityCooldownTimer: 0,
    gravityCooldownDuration: 2.1, // 2.1 seconds
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

  // Helper function to get target gravity from character's facing direction
  const getTargetGravityFromCharacterFacing = () => {
    // Get character's current world-space forward direction
    const currentQuaternion =
      characterState.current.currentSurfaceQuaternion.clone();
    currentQuaternion.premultiply(
      characterState.current.currentHorizontalQuaternion
    );

    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(currentQuaternion);

    // Find dominant axis
    const absX = Math.abs(forward.x);
    const absY = Math.abs(forward.y);
    const absZ = Math.abs(forward.z);

    if (absX > absY && absX > absZ) {
      return {
        gravity: forward.x > 0 ? [9.8, 0, 0] : [-9.8, 0, 0],
        surface: forward.x > 0 ? "right" : "left",
      };
    } else if (absY > absX && absY > absZ) {
      return {
        gravity: forward.y > 0 ? [0, 9.8, 0] : [0, -9.8, 0],
        surface: forward.y > 0 ? "top" : "bottom",
      };
    } else {
      return {
        gravity: forward.z > 0 ? [0, 0, 9.8] : [0, 0, -9.8],
        surface: forward.z > 0 ? "front" : "back",
      };
    }
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
        forward = new THREE.Vector3(0, 0, -1); // Flipped from floor to account for upside-down orientation
        right = new THREE.Vector3(-1, 0, 0); // Changed to (1, 0, 0) as requested
        break;
      case "front": // Front wall
        up = new THREE.Vector3(0, 0, -1);
        forward = new THREE.Vector3(0, 1, 0); // Fixed: was (0, -1, 0)
        right = new THREE.Vector3(1, 0, 0);
        break;
      case "back": // Back wall
        up = new THREE.Vector3(0, 0, 1);
        forward = new THREE.Vector3(0, -1, 0); // Fixed: was (0, 1, 0)
        right = new THREE.Vector3(1, 0, 0); // Fixed: was (-1, 0, 0)
        break;
      case "right": // Right wall
        up = new THREE.Vector3(-1, 0, 0);
        forward = new THREE.Vector3(0, 0, 1);
        right = new THREE.Vector3(0, 1, 0); // Fixed: was (0, -1, 0)
        break;
      case "left": // Left wall
        up = new THREE.Vector3(1, 0, 0);
        forward = new THREE.Vector3(0, 0, 1); // Fixed: was (0, 0, -1)
        right = new THREE.Vector3(0, -1, 0); // Fixed: was (0, 1, 0)
        break;
    }

    // Apply horizontal rotation to forward and right vectors
    const rotationQuaternion = new THREE.Quaternion();
    rotationQuaternion.setFromAxisAngle(up, horizontalRotation);

    forward.applyQuaternion(rotationQuaternion);
    right.applyQuaternion(rotationQuaternion);

    return { up, forward, right };
  };

  // Helper function to get world "up vector" for a surface
  const getSurfaceUpVector = (surface) => {
    switch (surface) {
      case "bottom":
        return new THREE.Vector3(0, 1, 0); // +Y
      case "top":
        return new THREE.Vector3(0, -1, 0); // -Y
      case "front":
        return new THREE.Vector3(0, 0, -1); // -Z
      case "back":
        return new THREE.Vector3(0, 0, 1); // +Z
      case "right":
        return new THREE.Vector3(-1, 0, 0); // -X
      case "left":
        return new THREE.Vector3(1, 0, 0); // +X
      default:
        return new THREE.Vector3(0, 1, 0);
    }
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

  // Subscribe to gravity change key (G)
  useEffect(() => {
    const unsubscribeG = subscribeKeys(
      (state) => state.gravityChange,
      (pressed) => {
        if (pressed) {
          // Check if gravity change is on cooldown
          if (characterState.current.gravityCooldown) {
            console.log("Gravity change on cooldown - ignoring G press");
            return;
          }

          // Start gravity change cooldown
          characterState.current.gravityCooldown = true;
          characterState.current.gravityCooldownTimer = 0;
          console.log("Starting gravity change cooldown");

          // STEP 1: Get the "up vector" from the current surface (before transition)
          const fromSurfaceUpVector = getSurfaceUpVector(currentFloorSurface);

          // STEP 2: Get target direction from character's facing
          const { gravity, surface } = getTargetGravityFromCharacterFacing();

          console.log(
            `G pressed: transitioning from ${currentFloorSurface} to ${surface}, gravity: [${gravity}]`
          );
          console.log(`From surface up vector:`, fromSurfaceUpVector);

          // STEP 3: Change gravity immediately
          setCurrentGravity(gravity);

          // STEP 4: Apply new surface quaternion
          const newSurfaceQuaternion = calculateTargetQuaternion(surface);
          characterState.current.currentSurfaceQuaternion.copy(
            newSurfaceQuaternion
          );
          characterState.current.targetSurfaceQuaternion.copy(
            newSurfaceQuaternion
          );

          // STEP 5: Calculate horizontal rotation to face the "from surface up vector"
          // We want the character to face the fromSurfaceUpVector direction on the new surface

          // Get the surface vectors for the new surface
          const { up: newSurfaceUp, forward: newDefaultForward } =
            getSurfaceVectors(surface, 0);

          console.log(`New surface up:`, newSurfaceUp);
          console.log(`New surface default forward:`, newDefaultForward);

          // Project the target world direction onto the new surface's horizontal plane
          // Remove any component along the surface normal (up direction)
          const projectedTarget = fromSurfaceUpVector.clone();
          const normalComponent = projectedTarget.dot(newSurfaceUp);
          projectedTarget.addScaledVector(newSurfaceUp, -normalComponent);

          console.log(`Projected target on new surface:`, projectedTarget);
          console.log(`Projected target length:`, projectedTarget.length());

          // Check if target direction is not perpendicular to the surface
          if (projectedTarget.length() > 0.001) {
            projectedTarget.normalize();

            // Calculate the angle between the default forward and our target direction
            // on the new surface's horizontal plane
            const dotProduct = newDefaultForward.dot(projectedTarget);
            const crossProduct = newDefaultForward
              .clone()
              .cross(projectedTarget);
            const angle = Math.atan2(
              crossProduct.dot(newSurfaceUp),
              dotProduct
            );

            console.log(
              `Calculated angle:`,
              angle,
              `(${((angle * 180) / Math.PI).toFixed(1)} degrees)`
            );

            // Set the new horizontal rotation
            characterState.current.horizontalRotation = angle;
            characterState.current.currentHorizontalQuaternion.setFromAxisAngle(
              newSurfaceUp,
              angle
            );
          } else {
            // Target direction is perpendicular to surface - no meaningful horizontal direction
            console.log(
              `Target direction is perpendicular to surface, setting rotation to 0`
            );
            characterState.current.horizontalRotation = 0;
            characterState.current.currentHorizontalQuaternion.identity();
          }

          // Trigger camera pause for 2 seconds during surface transition
          characterState.current.cameraPaused = true;
          characterState.current.cameraPauseTimer = 0;
          console.log(
            "Camera pause started - will capture camera state in next frame"
          );

          // Ensure not transitioning (since change is instant)
          characterState.current.isTransitioning = false;
        }
      }
    );

    return () => {
      if (typeof unsubscribeG === "function") {
        unsubscribeG();
      }
    };
  }, [subscribeKeys, setCurrentGravity, currentGravity, currentFloorSurface]);

  // Function to handle camera collision detection
  const handleCameraCollision = (
    characterPosition,
    idealCameraPosition,
    surfaceNormal
  ) => {
    // Create ray origin at character position with surface-relative height adjustment
    const surfaceRelativeOffset = surfaceNormal
      .clone()
      .multiplyScalar(cameraLookAtHeight);
    const rayOrigin = new THREE.Vector3(
      characterPosition.x + surfaceRelativeOffset.x,
      characterPosition.y + surfaceRelativeOffset.y,
      characterPosition.z + surfaceRelativeOffset.z
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

    // If we hit something, adjust camera position and calculate tilt
    if (hit && hit.timeOfImpact < distanceToCamera) {
      // Calculate adjusted position at hit point minus a small offset to avoid clipping
      const adjustedDistance = hit.timeOfImpact - cameraCollisionOffset;

      // Calculate new position
      const adjustedPosition = new THREE.Vector3();
      adjustedPosition.copy(rayOrigin);
      adjustedPosition.addScaledVector(rayDirection, adjustedDistance);

      // Calculate tilt amount based on how much we had to pull the camera closer
      const distanceReduction = distanceToCamera - adjustedDistance;
      const maxTiltAngle = Math.PI / 12; // 15 degrees max tilt
      const tiltAmount =
        Math.min(distanceReduction / cameraDistance, 1.0) * maxTiltAngle;

      return {
        position: adjustedPosition,
        tilt: tiltAmount,
      };
    }

    // No collision, return ideal position with no tilt
    return {
      position: idealCameraPosition,
      tilt: 0,
    };
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

    // Update camera pause timer
    if (characterState.current.cameraPaused) {
      if (characterState.current.cameraPauseTimer === 0) {
        // First frame of pause - capture current smoothed camera state
        characterState.current.pausedCameraPosition.copy(
          smoothedCameraPosition
        );
        characterState.current.pausedCameraTarget.copy(smoothedCameraTarget);
        characterState.current.pausedCameraUp.copy(state.camera.up);
        console.log("Captured smoothed camera state and starting freeze");
      }

      characterState.current.cameraPauseTimer += delta;

      if (
        characterState.current.cameraPauseTimer >=
        characterState.current.cameraPauseDuration
      ) {
        // End pause
        characterState.current.cameraPaused = false;
        characterState.current.cameraPauseTimer = 0;
        console.log("Camera pause ended - resuming normal camera behavior");
      }
    }

    // Update gravity change cooldown timer
    if (characterState.current.gravityCooldown) {
      characterState.current.gravityCooldownTimer += delta;

      if (
        characterState.current.gravityCooldownTimer >=
        characterState.current.gravityCooldownDuration
      ) {
        // End cooldown
        characterState.current.gravityCooldown = false;
        characterState.current.gravityCooldownTimer = 0;
        console.log("Gravity change cooldown ended - G key available");
      }
    }

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
        const { up } = getSurfaceVectors(currentFloorSurface, 0);

        // Create new horizontal rotation quaternion
        characterState.current.currentHorizontalQuaternion.setFromAxisAngle(
          up,
          characterState.current.horizontalRotation
        );
      }
    }

    // Calculate final combined quaternion (surface orientation + horizontal rotation)
    // Apply surface orientation first, then horizontal rotation in surface-local space
    const finalQuaternion =
      characterState.current.currentSurfaceQuaternion.clone();
    finalQuaternion.premultiply(
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
        currentFloorSurface,
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
    const gravityStrength = 5;
    rigidBodyRef.current.applyImpulse(
      {
        x: currentGravity[0] * delta * gravityStrength,
        y: currentGravity[1] * delta * gravityStrength,
        z: currentGravity[2] * delta * gravityStrength,
      },
      true
    );

    // Calculate surface-relative camera positioning
    // Use ONLY surface orientation (not character facing) for camera positioning
    const surfaceOnlyQuaternion =
      characterState.current.currentSurfaceQuaternion.clone();

    // Derive surface coordinate system from surface orientation only
    const surfaceNormal = new THREE.Vector3(0, 1, 0); // Local "up" direction
    surfaceNormal.applyQuaternion(surfaceOnlyQuaternion); // Transform to world space

    const surfaceForward = new THREE.Vector3(0, 0, 1); // Local "forward" direction
    surfaceForward.applyQuaternion(surfaceOnlyQuaternion); // Transform to world space

    // Apply horizontal rotation to forward direction only (for character facing)
    const characterForward = surfaceForward.clone();
    const horizontalQuaternion = new THREE.Quaternion();
    horizontalQuaternion.setFromAxisAngle(
      surfaceNormal,
      characterState.current.horizontalRotation
    );
    characterForward.applyQuaternion(horizontalQuaternion);

    // Calculate character's backward direction (opposite of character's facing on the surface)
    const characterBackward = characterForward.clone().negate();

    // Calculate camera position using: character + (backward * distance) + (normal * height)
    const backwardOffset = characterBackward
      .clone()
      .multiplyScalar(cameraDistance);
    const normalOffset = surfaceNormal.clone().multiplyScalar(cameraHeight);

    const idealCameraPosition = new THREE.Vector3(
      position.x + backwardOffset.x + normalOffset.x,
      position.y + backwardOffset.y + normalOffset.y,
      position.z + backwardOffset.z + normalOffset.z
    );

    // Check for camera collisions and adjust position if needed
    const collisionResult = handleCameraCollision(
      characterPosition,
      idealCameraPosition,
      surfaceNormal
    );
    const collisionAdjustedPosition = collisionResult.position;
    const tiltAmount = collisionResult.tilt;

    // Set camera up direction based on surface (pointing away from surface)
    const cameraUpDirection = surfaceNormal.clone();

    // Calculate look-at target (character position with surface-relative height offset)
    const surfaceRelativeLookAtOffset = surfaceNormal
      .clone()
      .multiplyScalar(cameraLookAtHeight);
    let targetLookAt = new THREE.Vector3(
      position.x + surfaceRelativeLookAtOffset.x,
      position.y + surfaceRelativeLookAtOffset.y,
      position.z + surfaceRelativeLookAtOffset.z
    );

    // Apply tilt when collision is detected
    if (tiltAmount > 0) {
      // Calculate the surface's "right" vector from surface orientation only
      const surfaceRight = new THREE.Vector3(1, 0, 0); // Local "right" direction
      surfaceRight.applyQuaternion(surfaceOnlyQuaternion); // Transform to world space

      // Create tilt rotation around the surface right axis (tilts camera down)
      const tiltQuaternion = new THREE.Quaternion();
      tiltQuaternion.setFromAxisAngle(surfaceRight, tiltAmount);

      // Apply tilt to the look-at direction
      const lookAtDirection = new THREE.Vector3();
      lookAtDirection.subVectors(targetLookAt, collisionAdjustedPosition);
      lookAtDirection.applyQuaternion(tiltQuaternion);

      // Update the tilted look-at target
      targetLookAt = collisionAdjustedPosition.clone().add(lookAtDirection);
    }

    // Update camera position and orientation
    if (characterState.current.cameraPaused) {
      // During pause, keep camera frozen at the stored smoothed position/orientation
      state.camera.position.copy(characterState.current.pausedCameraPosition);
      state.camera.lookAt(characterState.current.pausedCameraTarget);
      state.camera.up.copy(characterState.current.pausedCameraUp);
      state.camera.lookAt(characterState.current.pausedCameraTarget); // Call lookAt again after setting up vector
    } else {
      // Normal camera behavior - smoothly interpolate camera position and target
      smoothedCameraPosition.lerp(collisionAdjustedPosition, 5 * delta);
      smoothedCameraTarget.lerp(targetLookAt, 5 * delta);

      // Update camera position and orientation
      state.camera.position.copy(smoothedCameraPosition);

      // Set camera to look at character with correct up direction
      state.camera.lookAt(smoothedCameraTarget);
      state.camera.up.copy(cameraUpDirection);
      state.camera.lookAt(smoothedCameraTarget); // Call lookAt again after setting up vector
    }

    // console.log(position);
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

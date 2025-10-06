import { useRef, useEffect, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls, useAnimations } from "@react-three/drei";
import { RigidBody, CapsuleCollider, useRapier } from "@react-three/rapier";
import { useRoom } from "./RoomContext";
import { useCharacter } from "./CharacterContext";
import { useColyseus } from "@/context/ColyseusContext"; // Add this import
import * as THREE from "three";
import { calculateRoomPosition } from "../utils/roomUtils";
import { roomConfig } from "./Room/roomConfig";
import {
  getSurfaceUpVector,
  getSurfaceVectors,
  getFloorSurfaceFromGravity,
  calculateTargetQuaternion,
} from "../utils/surfaceUtils";

export default function Mage() {
  const mage = useGLTF("./models/characters/Barbarian.glb");
  const animations = useAnimations(mage.animations, mage.scene);
  const { updateCurrentRoom, getCurrentRoomCoords } = useRoom();
  const { sendPlayerUpdate, currentSessionId } = useColyseus(); // Add this line
  const {
    mageGravity: currentGravity,
    setMageGravity: setCurrentGravity,
    mageFloorSurface: currentFloorSurface,
    setMageFloorSurface: setCurrentFloorSurface,
  } = useCharacter();

  const rigidBodyRef = useRef();
  const mageRef = useRef();
  const capsuleRef = useRef();
  const currentActionRef = useRef(null);
  const fallingStateRef = useRef({
    isFalling: false,
    fallingFrames: 0,
    requiredFrames: 3,
  });

  // Track last sent data to avoid unnecessary updates
  const lastSentData = useRef({
    position: null,
    quaternion: null,
    animation: null,
    gravity: null,
    floorSurface: null,
    roomCoords: null,
  });

  // Get keyboard controls using drei's system
  const [subscribeKeys, getKeys] = useKeyboardControls();

  // Get rapier physics world
  const { rapier, world } = useRapier();

  // Character dimensions
  const capsuleHalfHeight = 0.25;
  const capsuleRadius = 0.5;
  const modelYOffset = -0.75;

  // Get initial position in the center of room [4,4,4]
  const centerCoords = [4, 4, 4];
  const roomPosition = calculateRoomPosition(centerCoords);

  // Place character slightly off center on the floor to avoid hole in middle
  const floorHeight = roomPosition[1] - roomConfig.innerSize / 2;
  const initialY = floorHeight + capsuleRadius + capsuleHalfHeight + 2;
  // Offset character 2 units from center to avoid central hole
  const initialPosition = [roomPosition[0] + 2, initialY, roomPosition[2] + 2];

  // Camera settings
  const cameraDistance = 5;
  const cameraHeight = 2;
  const cameraLookAtHeight = 1;
  const cameraCollisionOffset = 0.1;

  // Smoothed camera values
  const [smoothedCameraPosition] = useState(
    () => new THREE.Vector3(0, cameraHeight, -cameraDistance)
  );
  const [smoothedCameraTarget] = useState(() => new THREE.Vector3());

  // Character state - UPDATED to use quaternions
  const characterState = useRef({
    horizontalRotation: 0,
    currentHorizontalQuaternion: new THREE.Quaternion(),
    targetHorizontalQuaternion: new THREE.Quaternion(),
    moveSpeed: 5,
    rotationSpeed: 3,
    jumpForce: 4,
    acceleration: 25,
    deceleration: 8,
    isTransitioning: false,
    transitionProgress: 0,
    transitionDuration: 1.0,
    currentSurfaceQuaternion: new THREE.Quaternion(),
    targetSurfaceQuaternion: new THREE.Quaternion(),
    cameraPaused: false,
    cameraPauseTimer: 0,
    cameraPauseDuration: 2.0,
    pausedCameraPosition: new THREE.Vector3(),
    pausedCameraTarget: new THREE.Vector3(),
    pausedCameraUp: new THREE.Vector3(),
  });

  // Helper function to check if we should send an update
  const shouldSendUpdate = (currentData) => {
    const lastData = lastSentData.current;

    // Check position change (threshold: 0.1 units)
    if (
      !lastData.position ||
      Math.sqrt(
        Math.pow(currentData.position.x - lastData.position.x, 2) +
          Math.pow(currentData.position.y - lastData.position.y, 2) +
          Math.pow(currentData.position.z - lastData.position.z, 2)
      ) > 0.1
    ) {
      return true;
    }

    // Check rotation change (threshold: 0.05 radians ≈ 3 degrees)
    if (
      !lastData.quaternion ||
      Math.abs(currentData.quaternion.x - lastData.quaternion.x) > 0.05 ||
      Math.abs(currentData.quaternion.y - lastData.quaternion.y) > 0.05 ||
      Math.abs(currentData.quaternion.z - lastData.quaternion.z) > 0.05 ||
      Math.abs(currentData.quaternion.w - lastData.quaternion.w) > 0.05
    ) {
      return true;
    }

    // Check animation change
    if (currentData.animation !== lastData.animation) {
      return true;
    }

    // Check gravity change
    if (
      !lastData.gravity ||
      Math.abs(currentData.gravity[0] - lastData.gravity[0]) > 0.1 ||
      Math.abs(currentData.gravity[1] - lastData.gravity[1]) > 0.1 ||
      Math.abs(currentData.gravity[2] - lastData.gravity[2]) > 0.1
    ) {
      return true;
    }

    // Check floor surface change
    if (currentData.floorSurface !== lastData.floorSurface) {
      return true;
    }

    // Check room coordinates change
    if (
      !lastData.roomCoords ||
      currentData.roomCoords[0] !== lastData.roomCoords[0] ||
      currentData.roomCoords[1] !== lastData.roomCoords[1] ||
      currentData.roomCoords[2] !== lastData.roomCoords[2]
    ) {
      return true;
    }

    return false;
  };

  // Helper function to get target gravity from character's facing direction
  const getTargetGravityFromCharacterFacing = () => {
    const currentQuaternion =
      characterState.current.currentSurfaceQuaternion.clone();
    currentQuaternion.premultiply(
      characterState.current.currentHorizontalQuaternion
    );

    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(currentQuaternion);

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

  // Update current floor surface whenever gravity changes
  useEffect(() => {
    const newFloorSurface = getFloorSurfaceFromGravity(currentGravity);
    setCurrentFloorSurface(newFloorSurface);
  }, [currentGravity, setCurrentFloorSurface]);

  // Subscribe to jump key
  useEffect(() => {
    const unsubscribeJump = subscribeKeys(
      (state) => state.mageJump,
      (pressed) => {
        if (pressed && rigidBodyRef.current) {
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

  // Subscribe to gravity change key (G) - UPDATED to send to server
  useEffect(() => {
    const unsubscribeG = subscribeKeys(
      (state) => state.mageGravityChange,
      (pressed) => {
        if (pressed) {
          const fromSurfaceUpVector = getSurfaceUpVector(currentFloorSurface);
          const { gravity, surface } = getTargetGravityFromCharacterFacing();

          setCurrentGravity(gravity);
          setCurrentFloorSurface(surface);

          const newSurfaceQuaternion = calculateTargetQuaternion(surface);
          characterState.current.currentSurfaceQuaternion.copy(
            newSurfaceQuaternion
          );
          characterState.current.targetSurfaceQuaternion.copy(
            newSurfaceQuaternion
          );

          const { up: newSurfaceUp, forward: newDefaultForward } =
            getSurfaceVectors(surface, 0);

          const projectedTarget = fromSurfaceUpVector.clone();
          const normalComponent = projectedTarget.dot(newSurfaceUp);
          projectedTarget.addScaledVector(newSurfaceUp, -normalComponent);

          if (projectedTarget.length() > 0.001) {
            projectedTarget.normalize();

            const dotProduct = newDefaultForward.dot(projectedTarget);
            const crossProduct = newDefaultForward
              .clone()
              .cross(projectedTarget);
            const angle = Math.atan2(
              crossProduct.dot(newSurfaceUp),
              dotProduct
            );
            characterState.current.horizontalRotation = angle;
            characterState.current.currentHorizontalQuaternion.setFromAxisAngle(
              newSurfaceUp,
              angle
            );
          } else {
            characterState.current.horizontalRotation = 0;
            characterState.current.currentHorizontalQuaternion.identity();
          }

          characterState.current.cameraPaused = true;
          characterState.current.cameraPauseTimer = 0;
          characterState.current.isTransitioning = false;
        }
      }
    );

    return () => {
      if (typeof unsubscribeG === "function") {
        unsubscribeG();
      }
    };
  }, [
    subscribeKeys,
    setCurrentGravity,
    setCurrentFloorSurface,
    currentGravity,
    currentFloorSurface,
  ]);

  // Function to handle camera collision detection
  const handleCameraCollision = (
    characterPosition,
    idealCameraPosition,
    surfaceNormal
  ) => {
    const surfaceRelativeOffset = surfaceNormal
      .clone()
      .multiplyScalar(cameraLookAtHeight);
    const rayOrigin = new THREE.Vector3(
      characterPosition.x + surfaceRelativeOffset.x,
      characterPosition.y + surfaceRelativeOffset.y,
      characterPosition.z + surfaceRelativeOffset.z
    );

    const rayDirection = new THREE.Vector3();
    rayDirection.subVectors(idealCameraPosition, rayOrigin).normalize();

    const distanceToCamera = rayOrigin.distanceTo(idealCameraPosition);

    const ray = new rapier.Ray(
      { x: rayOrigin.x, y: rayOrigin.y, z: rayOrigin.z },
      { x: rayDirection.x, y: rayDirection.y, z: rayDirection.z }
    );

    const hit = world.castRay(ray, distanceToCamera, true);

    if (hit && hit.timeOfImpact < distanceToCamera) {
      const adjustedDistance = hit.timeOfImpact - cameraCollisionOffset;

      const adjustedPosition = new THREE.Vector3();
      adjustedPosition.copy(rayOrigin);
      adjustedPosition.addScaledVector(rayDirection, adjustedDistance);

      const distanceReduction = distanceToCamera - adjustedDistance;
      const maxTiltAngle = Math.PI / 12;
      const tiltAmount =
        Math.min(distanceReduction / cameraDistance, 1.0) * maxTiltAngle;

      return {
        position: adjustedPosition,
        tilt: tiltAmount,
      };
    }

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

    // HYBRID APPROACH: Handle large deltas from tab reactivation
    if (delta > 0.5) {
      // 100ms threshold - indicates tab was inactive
      // Reset physics state to prevent falling through geometry
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 });
      rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 });

      // Skip this frame entirely to avoid temporal inconsistencies
      return;
    }

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
        characterState.current.pausedCameraPosition.copy(
          smoothedCameraPosition
        );
        characterState.current.pausedCameraTarget.copy(smoothedCameraTarget);
        characterState.current.pausedCameraUp.copy(state.camera.up);
      }

      characterState.current.cameraPauseTimer += delta;

      if (
        characterState.current.cameraPauseTimer >=
        characterState.current.cameraPauseDuration
      ) {
        characterState.current.cameraPaused = false;
        characterState.current.cameraPauseTimer = 0;
      }
    }

    const {
      mageForward: forward,
      mageBackward: backward,
      mageLeftward: leftward,
      mageRightward: rightward,
    } = getKeys();

    // Check if character is falling (velocity-based detection)
    const currentVel = rigidBodyRef.current.linvel();
    const velocityVector = new THREE.Vector3(
      currentVel.x,
      currentVel.y,
      currentVel.z
    );

    const gravityDirection = new THREE.Vector3(...currentGravity).normalize();
    const fallingVelocity = velocityVector.dot(gravityDirection);
    const fallingThreshold = 1.5;
    const isCurrentlyFalling = fallingVelocity > fallingThreshold;

    if (isCurrentlyFalling) {
      fallingStateRef.current.fallingFrames++;
    } else {
      fallingStateRef.current.fallingFrames = 0;
    }

    const persistentFalling =
      fallingStateRef.current.fallingFrames >=
      fallingStateRef.current.requiredFrames;
    fallingStateRef.current.isFalling = persistentFalling;

    // Determine current animation
    let currentAnimationName = "Idle";
    if (persistentFalling) {
      playAction(animations.actions.Jump_Idle);
      currentAnimationName = "Jump_Idle";
    } else if (forward) {
      playAction(animations.actions.Running_A);
      currentAnimationName = "Running_A";
    } else if (backward) {
      playAction(animations.actions.Walking_Backwards);
      currentAnimationName = "Walking_Backwards";
    } else {
      playAction(animations.actions.Idle);
      currentAnimationName = "Idle";
    }

    // Handle surface transition
    if (characterState.current.isTransitioning) {
      characterState.current.transitionProgress +=
        delta / characterState.current.transitionDuration;

      if (characterState.current.transitionProgress >= 1.0) {
        characterState.current.transitionProgress = 1.0;
        characterState.current.isTransitioning = false;
        characterState.current.currentSurfaceQuaternion.copy(
          characterState.current.targetSurfaceQuaternion
        );
      }

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

        const { up } = getSurfaceVectors(
          currentFloorSurface,
          characterState.current.horizontalRotation
        );

        characterState.current.currentHorizontalQuaternion.setFromAxisAngle(
          up,
          characterState.current.horizontalRotation
        );
      }
    }

    // Calculate final combined quaternion (surface orientation + horizontal rotation)
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

    // Movement calculations (only when not transitioning)
    if (!characterState.current.isTransitioning) {
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

      const targetVelocity = new THREE.Vector3();
      if (moveDirection.length() > 0) {
        moveDirection.normalize();
        moveDirection.multiplyScalar(characterState.current.moveSpeed);
        targetVelocity.copy(moveDirection);
      }

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

    // Apply gravity force each frame
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
    const surfaceOnlyQuaternion =
      characterState.current.currentSurfaceQuaternion.clone();

    const surfaceNormal = new THREE.Vector3(0, 1, 0);
    surfaceNormal.applyQuaternion(surfaceOnlyQuaternion);

    const surfaceForward = new THREE.Vector3(0, 0, 1);
    surfaceForward.applyQuaternion(surfaceOnlyQuaternion);

    const characterForward = surfaceForward.clone();
    const horizontalQuaternion = new THREE.Quaternion();
    horizontalQuaternion.setFromAxisAngle(
      surfaceNormal,
      characterState.current.horizontalRotation
    );
    characterForward.applyQuaternion(horizontalQuaternion);

    const characterBackward = characterForward.clone().negate();

    const backwardOffset = characterBackward
      .clone()
      .multiplyScalar(cameraDistance);
    const normalOffset = surfaceNormal.clone().multiplyScalar(cameraHeight);

    const idealCameraPosition = new THREE.Vector3(
      position.x + backwardOffset.x + normalOffset.x,
      position.y + backwardOffset.y + normalOffset.y,
      position.z + backwardOffset.z + normalOffset.z
    );

    const collisionResult = handleCameraCollision(
      characterPosition,
      idealCameraPosition,
      surfaceNormal
    );
    const collisionAdjustedPosition = collisionResult.position;
    const tiltAmount = collisionResult.tilt;

    const cameraUpDirection = surfaceNormal.clone();

    const surfaceRelativeLookAtOffset = surfaceNormal
      .clone()
      .multiplyScalar(cameraLookAtHeight);
    let targetLookAt = new THREE.Vector3(
      position.x + surfaceRelativeLookAtOffset.x,
      position.y + surfaceRelativeLookAtOffset.y,
      position.z + surfaceRelativeLookAtOffset.z
    );

    if (tiltAmount > 0) {
      const { right: surfaceRight } = getSurfaceVectors(
        currentFloorSurface,
        characterState.current.horizontalRotation
      );

      const tiltQuaternion = new THREE.Quaternion();
      tiltQuaternion.setFromAxisAngle(surfaceRight, tiltAmount);

      const lookAtDirection = new THREE.Vector3();
      lookAtDirection.subVectors(targetLookAt, collisionAdjustedPosition);
      lookAtDirection.applyQuaternion(tiltQuaternion);

      targetLookAt = collisionAdjustedPosition.clone().add(lookAtDirection);
    }

    // Update camera position and orientation
    if (characterState.current.cameraPaused) {
      state.camera.position.copy(characterState.current.pausedCameraPosition);
      state.camera.lookAt(characterPosition);
      state.camera.up.copy(characterState.current.pausedCameraUp);
      state.camera.lookAt(characterPosition);
    } else {
      smoothedCameraPosition.lerp(collisionAdjustedPosition, 5 * delta);
      smoothedCameraTarget.lerp(targetLookAt, 5 * delta);

      state.camera.position.copy(smoothedCameraPosition);
      state.camera.lookAt(smoothedCameraTarget);
      state.camera.up.copy(cameraUpDirection);
      state.camera.lookAt(smoothedCameraTarget);
    }

    // MULTIPLAYER UPDATE: Send player data to server
    if (sendPlayerUpdate && currentSessionId) {
      const currentRoomCoords = getCurrentRoomCoords();

      const updateData = {
        position: {
          x: position.x,
          y: position.y,
          z: position.z,
        },
        quaternion: {
          x: finalQuaternion.x,
          y: finalQuaternion.y,
          z: finalQuaternion.z,
          w: finalQuaternion.w,
        },
        animation: currentAnimationName,
        gravity: currentGravity,
        floorSurface: currentFloorSurface,
        roomCoords: currentRoomCoords,
      };

      // Only send update if there's a significant change
      if (shouldSendUpdate(updateData)) {
        sendPlayerUpdate(updateData);

        // Update last sent data
        lastSentData.current = {
          position: new THREE.Vector3(position.x, position.y, position.z),
          quaternion: finalQuaternion.clone(),
          animation: currentAnimationName,
          gravity: [...currentGravity],
          floorSurface: currentFloorSurface,
          roomCoords: [...currentRoomCoords],
        };
      }
    }
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
        />
      </group>
    </RigidBody>
  );
}

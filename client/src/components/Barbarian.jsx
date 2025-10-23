import { useRef, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls, useAnimations } from "@react-three/drei";
import { RigidBody, CapsuleCollider } from "@react-three/rapier";
import { useRoom } from "./RoomContext";
import { useCharacter } from "./CharacterContext";
import * as THREE from "three";
import { calculateRoomPosition } from "../utils/roomUtils";
import { roomConfig } from "./Room/roomConfig";
import {
  getSurfaceUpVector,
  getSurfaceVectors,
  getFloorSurfaceFromGravity,
  calculateTargetQuaternion,
} from "../utils/surfaceUtils";

export default function Barbarian() {
  const barbarian = useGLTF("./models/characters/Barbarian.glb");
  const animations = useAnimations(barbarian.animations, barbarian.scene);
  const { getCurrentRoomCoords } = useRoom();
  const {
    barbarianGravity: currentGravity,
    setBarbarianGravity: setCurrentGravity,
    barbarianFloorSurface: currentFloorSurface,
    setBarbarianFloorSurface: setCurrentFloorSurface,
  } = useCharacter();

  const rigidBodyRef = useRef();
  const barbarianRef = useRef();
  const capsuleRef = useRef();
  const currentActionRef = useRef(null);
  const fallingStateRef = useRef({
    isFalling: false,
    fallingFrames: 0,
    requiredFrames: 3, // Require 3 consecutive frames of falling before animation
  });

  // Get keyboard controls using drei's system
  const [subscribeKeys, getKeys] = useKeyboardControls();

  // Get rapier physics world (not needed for this component)
  // const { rapier, world } = useRapier();
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
  // Offset barbarian differently from mage to avoid collision (-2 units from center)
  const initialPosition = [roomPosition[0] - 2, initialY, roomPosition[2] - 2];

  // Character state - UPDATED to use quaternions
  const characterState = useRef({
    // Replace rotation with quaternion-based rotation
    horizontalRotation: 0, // Keep track of horizontal rotation in radians
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
  });

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
    console.log("Barbarian current room coordinates:", currentCoords);
  }, [getCurrentRoomCoords]);

  // Update current floor surface whenever gravity changes
  useEffect(() => {
    const newFloorSurface = getFloorSurfaceFromGravity(currentGravity);
    setCurrentFloorSurface(newFloorSurface);
    console.log(
      `Barbarian current floor surface updated to: ${newFloorSurface}`
    );
  }, [currentGravity, setCurrentFloorSurface]);

  // Subscribe to jump key
  useEffect(() => {
    const unsubscribeJump = subscribeKeys(
      (state) => state.barbarianJump,
      (pressed) => {
        if (pressed && rigidBodyRef.current) {
          // Apply jump force on shift press
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

  // Subscribe to gravity change key (H)
  useEffect(() => {
    const unsubscribeH = subscribeKeys(
      (state) => state.barbarianGravityChange,
      (pressed) => {
        if (pressed) {
          // STEP 1: Get the "up vector" from the current surface (before transition)
          const fromSurfaceUpVector = getSurfaceUpVector(currentFloorSurface);

          // STEP 2: Get target direction from character's facing
          const { gravity, surface } = getTargetGravityFromCharacterFacing();

          // STEP 3: Change gravity immediately
          setCurrentGravity(gravity);
          setCurrentFloorSurface(surface);

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

          // Project the target world direction onto the new surface's horizontal plane
          // Remove any component along the surface normal (up direction)
          const projectedTarget = fromSurfaceUpVector.clone();
          const normalComponent = projectedTarget.dot(newSurfaceUp);
          projectedTarget.addScaledVector(newSurfaceUp, -normalComponent);

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
            // Set the new horizontal rotation
            characterState.current.horizontalRotation = angle;
            characterState.current.currentHorizontalQuaternion.setFromAxisAngle(
              newSurfaceUp,
              angle
            );
          } else {
            // Target direction is perpendicular to surface - no meaningful horizontal direction
            characterState.current.horizontalRotation = 0;
            characterState.current.currentHorizontalQuaternion.identity();
          }

          // Ensure not transitioning (since change is instant)
          characterState.current.isTransitioning = false;
        }
      }
    );

    return () => {
      if (typeof unsubscribeH === "function") {
        unsubscribeH();
      }
    };
  }, [
    subscribeKeys,
    setCurrentGravity,
    setCurrentFloorSurface,
    currentGravity,
    currentFloorSurface,
  ]);

  // Function to smoothly play a new animation
  const playAction = (newAction) => {
    if (!newAction || currentActionRef.current === newAction) return;
    if (currentActionRef.current) {
      currentActionRef.current.fadeOut(0.2);
    }
    newAction.reset().fadeIn(0.2).play();
    currentActionRef.current = newAction;
  };

  // Update physics each frame (no camera logic)
  useFrame((state, delta) => {
    if (!rigidBodyRef.current || !barbarianRef.current) return;

    // Get character position (not used for room updates)
    // const position = rigidBodyRef.current.translation();

    // Update current room based on character position
    // updateCurrentRoom([position.x, position.y, position.z]);

    const {
      barbarianForward: forward,
      barbarianBackward: backward,
      barbarianLeftward: leftward,
      barbarianRightward: rightward,
    } = getKeys();

    // Check if character is falling (velocity-based detection)
    const currentVel = rigidBodyRef.current.linvel();
    const velocityVector = new THREE.Vector3(
      currentVel.x,
      currentVel.y,
      currentVel.z
    );

    // Normalize gravity direction for comparison
    const gravityDirection = new THREE.Vector3(...currentGravity).normalize();

    // Calculate velocity component in gravity direction
    const fallingVelocity = velocityVector.dot(gravityDirection);

    // Threshold for determining if character is falling
    // Lowered threshold since the oscillating values show normal values are 0.4-1.0
    const fallingThreshold = 1.5;
    const isCurrentlyFalling = fallingVelocity > fallingThreshold;

    // Update falling state with persistence check
    if (isCurrentlyFalling) {
      fallingStateRef.current.fallingFrames++;
    } else {
      fallingStateRef.current.fallingFrames = 0;
    }

    // Only consider "falling" if it persists for required frames
    const persistentFalling =
      fallingStateRef.current.fallingFrames >=
      fallingStateRef.current.requiredFrames;
    fallingStateRef.current.isFalling = persistentFalling;

    // Handle animation switching (persistent falling has priority)
    if (persistentFalling) {
      playAction(animations.actions.Jump_Idle);
    } else if (forward) {
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

      // Air control scaling
      const airSpeedFactor = fallingStateRef.current.isFalling ? 0.6 : 1.0;
      const airAccelFactor = fallingStateRef.current.isFalling ? 0.6 : 1.0;

      // Apply movement (preserve current velocity in gravity direction)
      const targetVelocity = new THREE.Vector3();
      if (moveDirection.length() > 0) {
        moveDirection.normalize();
        moveDirection.multiplyScalar(
          characterState.current.moveSpeed * airSpeedFactor
        );
        targetVelocity.copy(moveDirection);
      }

      // Preserve current velocity to maintain gravity/physics, remove gravity component
      const currentVelocity = new THREE.Vector3(
        currentVel.x,
        currentVel.y,
        currentVel.z
      );
      const horizontalCurrent = currentVelocity
        .clone()
        .addScaledVector(
          gravityDirection,
          -currentVelocity.dot(gravityDirection)
        );
      const velocityDiff = new THREE.Vector3();
      velocityDiff.subVectors(targetVelocity, horizontalCurrent);

      const accelerationRate =
        moveDirection.length() > 0
          ? characterState.current.acceleration
          : characterState.current.deceleration;

      velocityDiff.multiplyScalar(accelerationRate * airAccelFactor * delta);
      rigidBodyRef.current.applyImpulse(
        { x: velocityDiff.x, y: velocityDiff.y, z: velocityDiff.z },
        true
      );
    }

    // Apply gravity force each frame (using current gravity direction)
    const gravityStrength = 3;
    rigidBodyRef.current.applyImpulse(
      {
        x: currentGravity[0] * delta * gravityStrength,
        y: currentGravity[1] * delta * gravityStrength,
        z: currentGravity[2] * delta * gravityStrength,
      },
      true
    );
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
      <group ref={barbarianRef}>
        <primitive
          object={barbarian.scene}
          scale={0.5}
          position={[0, modelYOffset, 0]}
          // No rotation - inherits from RigidBody (quaternion-based)
        />
      </group>
    </RigidBody>
  );
}

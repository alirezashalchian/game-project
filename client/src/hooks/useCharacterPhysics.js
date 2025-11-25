import * as THREE from "three";
import { getSurfaceVectors } from "../utils/surfaceUtils";

export const useCharacterPhysics = (
  rigidBodyRef,
  characterState,
  fallingStateRef,
  options = {}
) => {
  const {
    moveSpeed = 5,
    acceleration = 25,
    deceleration = 8,
    rotationSpeed = 3,
    gravityStrength = 1.25,
  } = options;

  const updatePhysics = (delta, keys, currentFloorSurface, currentGravity) => {
    if (!rigidBodyRef.current || !characterState.current) return null;

    const {
      forward,
      backward,
      leftward,
      rightward,
    } = keys;

    // 1. Handle Horizontal Rotation
    if (!characterState.current.isTransitioning) {
      let rotationChange = 0;
      if (leftward) rotationChange = rotationSpeed * delta;
      if (rightward) rotationChange = -rotationSpeed * delta;

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

    // 2. Calculate Final Rotation (Surface + Horizontal)
    const finalQuaternion =
      characterState.current.currentSurfaceQuaternion.clone();
    finalQuaternion.premultiply(
      characterState.current.currentHorizontalQuaternion
    );

    // 3. Apply Rotation to RigidBody
    rigidBodyRef.current.setRotation({
      x: finalQuaternion.x,
      y: finalQuaternion.y,
      z: finalQuaternion.z,
      w: finalQuaternion.w,
    });

    // 4. Handle Movement
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

      // Air control scaling
      const airSpeedFactor = fallingStateRef.current.isFalling ? 0.6 : 1.0;
      const airAccelFactor = fallingStateRef.current.isFalling ? 0.6 : 1.0;

      const targetVelocity = new THREE.Vector3();
      if (moveDirection.length() > 0) {
        moveDirection.normalize();
        moveDirection.multiplyScalar(moveSpeed * airSpeedFactor);
        targetVelocity.copy(moveDirection);
      }

      const currentVelocity = new THREE.Vector3(
        currentVel.x,
        currentVel.y,
        currentVel.z
      );
      
      const gravityDirection = new THREE.Vector3(...currentGravity).normalize();

      // Remove velocity component along gravity so WASD doesn't counteract falling
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
          ? acceleration
          : deceleration;

      velocityDiff.multiplyScalar(accelerationRate * airAccelFactor * delta);
      rigidBodyRef.current.applyImpulse(
        { x: velocityDiff.x, y: velocityDiff.y, z: velocityDiff.z },
        true
      );
    }

    // 5. Apply Gravity Force
    rigidBodyRef.current.applyImpulse(
      {
        x: currentGravity[0] * delta * gravityStrength,
        y: currentGravity[1] * delta * gravityStrength,
        z: currentGravity[2] * delta * gravityStrength,
      },
      true
    );

    return finalQuaternion;
  };

  return { updatePhysics };
};


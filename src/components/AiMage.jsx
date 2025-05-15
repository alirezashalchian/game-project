import { useRef, useEffect, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls, useAnimations } from "@react-three/drei";
import { RigidBody, CapsuleCollider, useRapier } from "@react-three/rapier";
import * as THREE from "three";

export default function Mage() {
  const mage = useGLTF("./models/characters/Mage.glb");
  const animations = useAnimations(mage.animations, mage.scene);

  const rigidBodyRef = useRef();
  const mageRef = useRef();
  const capsuleRef = useRef();
  const currentActionRef = useRef(null);

  // Get keyboard controls using drei's system
  const [subscribeKeys, getKeys] = useKeyboardControls();

  // Get rapier physics world
  const { rapier, world } = useRapier();

  // Floor position and character dimensions
  const floorPosition = -7.5;
  const capsuleHalfHeight = 0.25;
  const capsuleRadius = 0.5;
  const modelYOffset = -0.75;

  // Initial position
  const initialY = floorPosition + capsuleRadius + capsuleHalfHeight;
  const initialPosition = [4, initialY, 0];

  // Camera settings
  const cameraDistance = 5;
  const cameraHeight = 5;
  const cameraLookAtHeight = 1.5;
  const cameraCollisionOffset = 0.2;

  // Smoothed camera values
  const [smoothedCameraPosition] = useState(
    () => new THREE.Vector3(0, cameraHeight, -cameraDistance)
  );
  const [smoothedCameraTarget] = useState(() => new THREE.Vector3());

  // Character state
  const characterState = useRef({
    rotation: 0,
    isGrounded: false,
    jumpCooldown: 0,
    moveSpeed: 5,
    rotationSpeed: 3,
    jumpForce: 8,
    acceleration: 25,
    deceleration: 8,
  });

  // Jump when character is grounded
  // const jump = () => {
  //   const origin = rigidBodyRef.current.translation();
  //   origin.y -= capsuleRadius + capsuleHalfHeight + 0.1;
  //   const direction = { x: 0, y: -1, z: 0 };
  //   const ray = new rapier.Ray(origin, direction);
  //   const hit = world.castRay(ray, 10, true);
  //   console.log(origin.x);
  //   console.log(origin.z);

  //   if (hit.timeOfImpact < 0.15) {
  //     rigidBodyRef.current.applyImpulse({
  //       x: 0,
  //       y: characterState.current.jumpForce,
  //       z: 0,
  //     });

  //     // Play jump animation
  //     const jumpAction = animations.actions.Jump_Full_Long;
  //     if (jumpAction) {
  //       if (currentActionRef.current) {
  //         currentActionRef.current.fadeOut(0.1);
  //       }
  //       jumpAction.reset().fadeIn(0.1).play();
  //       currentActionRef.current = jumpAction;
  //     }
  //   }
  // };

  // // Setup keyboard controls
  // useEffect(() => {
  //   const unsubscribeJump = subscribeKeys(
  //     (state) => state.jump,
  //     (value) => {
  //       if (value) jump();
  //     }
  //   );

  //   return () => {
  //     unsubscribeJump();
  //   };
  // }, []);

  // Function to handle camera collision detection
  const handleCameraCollision = (characterPosition, idealCameraPosition) => {
    // Create ray origin at character position with a slight height adjustment
    const rayOrigin = new THREE.Vector3(
      characterPosition.x,
      characterPosition.y + cameraLookAtHeight, // Start at character's eye level
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
    if (hit && hit.toi < distanceToCamera) {
      // Calculate adjusted position at hit point minus a small offset to avoid clipping
      const adjustedDistance = hit.toi - cameraCollisionOffset;

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

    // Reduce jump cooldown
    if (characterState.current.jumpCooldown > 0) {
      characterState.current.jumpCooldown -= delta;
    }

    // Check grounded
    // const origin = rigidBodyRef.current.translation();
    // origin.y -= capsuleRadius + capsuleHalfHeight + 0.1;
    // const direction = { x: 0, y: -1, z: 0 };
    // const ray = new rapier.Ray(origin, direction);
    // const hit = world.castRay(ray, 10, true);
    // characterState.current.isGrounded = !!(hit && hit.timeOfImpact < 0.15);

    const { forward, backward, leftward, rightward } = getKeys();
    // const isInAir = !characterState.current.isGrounded;

    // Handle animation switching
    // if (isInAir) {
    //   playAction(animations.actions.Jump_Full_Long);}
    if (forward) {
      playAction(animations.actions.Running_A);
    } else if (backward) {
      playAction(animations.actions.Walking_Backwards);
    } else {
      playAction(animations.actions.Idle);
    }

    // Handle rotation
    let rotationChange = 0;
    if (leftward) rotationChange = characterState.current.rotationSpeed * delta;
    if (rightward)
      rotationChange = -characterState.current.rotationSpeed * delta;

    if (rotationChange !== 0) {
      characterState.current.rotation += rotationChange;
      mageRef.current.rotation.y = characterState.current.rotation;
    }

    const currentVel = rigidBodyRef.current.linvel();

    const moveDirection = new THREE.Vector3(0, 0, 0);
    if (forward) {
      moveDirection.x += Math.sin(characterState.current.rotation);
      moveDirection.z += Math.cos(characterState.current.rotation);
    }
    if (backward) {
      moveDirection.x -= Math.sin(characterState.current.rotation);
      moveDirection.z -= Math.cos(characterState.current.rotation);
    }

    const targetVelocity = new THREE.Vector3();
    if (moveDirection.length() > 0) {
      moveDirection.normalize();
      moveDirection.multiplyScalar(characterState.current.moveSpeed);
      targetVelocity.set(moveDirection.x, currentVel.y, moveDirection.z);
    } else {
      targetVelocity.set(0, currentVel.y, 0);
    }

    const currentVelocity = new THREE.Vector3(currentVel.x, 0, currentVel.z);
    const velocityDiff = new THREE.Vector3();
    velocityDiff.subVectors(targetVelocity, currentVelocity);

    const accelerationRate =
      moveDirection.length() > 0
        ? characterState.current.acceleration
        : characterState.current.deceleration;

    velocityDiff.multiplyScalar(accelerationRate * delta);
    rigidBodyRef.current.applyImpulse(
      { x: velocityDiff.x, y: 0, z: velocityDiff.z },
      true
    );

    const position = rigidBodyRef.current.translation();

    const cameraOffset = new THREE.Vector3(
      -Math.sin(characterState.current.rotation) * cameraDistance,
      cameraHeight,
      -Math.cos(characterState.current.rotation) * cameraDistance
    );

    const targetCameraPosition = new THREE.Vector3(
      position.x + cameraOffset.x,
      position.y + cameraOffset.y,
      position.z + cameraOffset.z
    );

    const targetLookAt = new THREE.Vector3(
      position.x,
      position.y + cameraLookAtHeight,
      position.z
    );

    smoothedCameraPosition.lerp(targetCameraPosition, 5 * delta);
    smoothedCameraTarget.lerp(targetLookAt, 5 * delta);

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
          rotation={[0, 0, 0]}
        />
      </group>
    </RigidBody>
  );
}

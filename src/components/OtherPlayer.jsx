import { useRef, useEffect, useState, useCallback } from "react";
import { useGLTF, useAnimations, Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";

// Preload the model once for all players
useGLTF.preload("./models/characters/Mage.glb");

// Cache cloned scenes to avoid repeated cloning
const sceneCache = new Map();

export default function OtherPlayer({ playerData, sessionId }) {
  const mage = useGLTF("./models/characters/Mage.glb");

  // Get or create cached cloned scene
  const [clonedScene] = useState(() => {
    const cacheKey = sessionId || Math.random().toString(36);

    if (!sceneCache.has(cacheKey)) {
      sceneCache.set(cacheKey, SkeletonUtils.clone(mage.scene));
    }
    return sceneCache.get(cacheKey);
  });

  // Use animations on the cloned scene
  const animations = useAnimations(mage.animations, clonedScene);

  const groupRef = useRef();
  const currentActionRef = useRef(null);
  const lastUpdateTime = useRef(0);

  // Optimized smoothing
  const [smoothedPosition] = useState(() => new THREE.Vector3());
  const [smoothedQuaternion] = useState(() => new THREE.Quaternion());
  const [targetPosition] = useState(() => new THREE.Vector3());
  const [targetQuaternion] = useState(() => new THREE.Quaternion());

  // Performance constants
  const LERP_FACTOR = 12;
  const ROTATION_LERP_FACTOR = 15;
  const UPDATE_THRESHOLD = 0.016; // ~60fps throttling
  const modelYOffset = -0.75;

  // Optimized animation switching
  const playAction = useCallback((newAction) => {
    if (!newAction || currentActionRef.current === newAction) return;
    if (currentActionRef.current) {
      currentActionRef.current.fadeOut(0.15); // Faster transition
    }
    newAction.reset().fadeIn(0.15).play();
    currentActionRef.current = newAction;
  }, []);

  // Batch updates to reduce re-renders
  const updateTargets = useCallback(
    (data) => {
      if (!data) return;

      targetPosition.set(data.position.x, data.position.y, data.position.z);
      targetQuaternion.set(
        data.quaternion.x,
        data.quaternion.y,
        data.quaternion.z,
        data.quaternion.w
      );

      // Handle animation with validation
      const animationName = data.animation;
      if (animations.actions && animations.actions[animationName]) {
        playAction(animations.actions[animationName]);
      }
    },
    [animations.actions, playAction, targetPosition, targetQuaternion]
  );

  // Update targets when player data changes
  useEffect(() => {
    updateTargets(playerData);
  }, [playerData, updateTargets]);

  // Initialize smoothed values on first render only
  useEffect(() => {
    if (playerData) {
      smoothedPosition.set(
        playerData.position.x,
        playerData.position.y,
        playerData.position.z
      );
      smoothedQuaternion.set(
        playerData.quaternion.x,
        playerData.quaternion.y,
        playerData.quaternion.z,
        playerData.quaternion.w
      );
    }
  }, []); // Only run once

  // Cleanup cached scene when component unmounts
  useEffect(() => {
    return () => {
      const cacheKey = sessionId || Math.random().toString(36);
      if (sceneCache.has(cacheKey)) {
        const cachedScene = sceneCache.get(cacheKey);
        // Dispose of resources
        cachedScene.traverse((child) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
        sceneCache.delete(cacheKey);
      }
    };
  }, [sessionId]);

  // Optimized frame updates with throttling
  useFrame((state, delta) => {
    if (!groupRef.current || !playerData) return;

    const currentTime = state.clock.elapsedTime;

    // Throttle updates for better performance
    if (currentTime - lastUpdateTime.current < UPDATE_THRESHOLD) return;
    lastUpdateTime.current = currentTime;

    // Optional: Distance-based LOD optimization
    const cameraPosition = state.camera.position;
    const playerPosition = groupRef.current.position;
    const distance = cameraPosition.distanceTo(playerPosition);

    // Adjust lerp speed based on distance
    const distanceFactor = Math.min(distance / 15, 1); // Max distance of 15 units
    const adjustedLerpPosition = LERP_FACTOR * (1 - distanceFactor * 0.3);
    const adjustedLerpRotation =
      ROTATION_LERP_FACTOR * (1 - distanceFactor * 0.3);

    // Smooth interpolation
    smoothedPosition.lerp(targetPosition, adjustedLerpPosition * delta);
    smoothedQuaternion.slerp(targetQuaternion, adjustedLerpRotation * delta);

    // Apply transforms
    groupRef.current.position.copy(smoothedPosition);
    groupRef.current.quaternion.copy(smoothedQuaternion);
  });

  if (!playerData) return null;

  // Get player name from data, fallback to session ID or "Player"
  const playerName =
    playerData.name ||
    playerData.playerName ||
    sessionId?.slice(-4) ||
    "Player";

  return (
    <group ref={groupRef}>
      <primitive
        object={clonedScene}
        scale={0.5}
        position={[0, modelYOffset, 0]}
      />

      {/* HTML Name Tag */}
      <Html
        position={[0, 1, 0]} // Above the character head
        center // Center the HTML element
        distanceFactor={8} // Scale with distance (lower = stays larger when far)
        occlude={false} // Don't hide behind objects
        transform={false} // Don't apply 3D transforms to HTML
        sprite={true} // Always face camera
        style={{
          background: "rgba(0, 0, 0, 0.7)",
          color: "#ffffff",
          padding: "4px 12px",
          borderRadius: "12px",
          fontSize: "12px",
          fontFamily: "Arial, sans-serif",
          fontWeight: "bold",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
          pointerEvents: "none",
          userSelect: "none",
          whiteSpace: "nowrap",
          textShadow: "1px 1px 2px rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(4px)", // Modern browsers only
        }}
      >
        {playerName}
      </Html>
    </group>
  );
}

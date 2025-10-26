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
  const cacheKey = sessionId || "missing";

  // Get or create cached cloned scene keyed by sessionId only
  const [clonedScene] = useState(() => {
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

  // Optimized smoothing - initialize with player position if available
  const [smoothedPosition] = useState(() =>
    playerData
      ? new THREE.Vector3(
          playerData.position.x,
          playerData.position.y,
          playerData.position.z
        )
      : new THREE.Vector3()
  );
  const [smoothedQuaternion] = useState(() =>
    playerData
      ? new THREE.Quaternion(
          playerData.quaternion.x,
          playerData.quaternion.y,
          playerData.quaternion.z,
          playerData.quaternion.w
        )
      : new THREE.Quaternion()
  );
  const [targetPosition] = useState(() => new THREE.Vector3());
  const [targetQuaternion] = useState(() => new THREE.Quaternion());

  // Interpolation snapshot buffer (timestamped)
  const snapshotsRef = useRef([]); // { timeMs, position: Vector3, quaternion: Quaternion }

  // Performance constants
  const UPDATE_THRESHOLD = 0.016; // ~60fps throttling
  const INTERP_DELAY_MS = 120; // buffer by ~2 frames
  const SNAP_DISTANCE = 0.02;
  const SNAP_ANGLE = 0.01; // radians
  const TELEPORT_DISTANCE = 6; // snap if jump exceeds this
  const SNAPSHOT_WINDOW_MS = 1500; // keep 1.5s of history
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

      const newPosition = new THREE.Vector3(
        data.position.x,
        data.position.y,
        data.position.z
      );

      targetPosition.set(data.position.x, data.position.y, data.position.z);
      targetQuaternion.set(
        data.quaternion.x,
        data.quaternion.y,
        data.quaternion.z,
        data.quaternion.w
      );

      // Push into snapshot buffer with timestamp
      const now = performance.now();
      snapshotsRef.current.push({
        timeMs: now,
        position: newPosition.clone(),
        quaternion: new THREE.Quaternion(
          data.quaternion.x,
          data.quaternion.y,
          data.quaternion.z,
          data.quaternion.w
        ),
      });

      // Trim old snapshots
      const cutoff = now - SNAPSHOT_WINDOW_MS;
      while (
        snapshotsRef.current.length > 0 &&
        snapshotsRef.current[0].timeMs < cutoff
      ) {
        snapshotsRef.current.shift();
      }

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

  // Cleanup cached scene when component unmounts (use sessionId-only key)
  useEffect(() => {
    return () => {
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
  }, [cacheKey]);

  // Optimized frame updates with throttling
  useFrame((state, delta) => {
    if (!groupRef.current || !playerData) return;

    if (delta > 0.5) {
      // On tab inactivity, snap to most recent snapshot if available
      const latest = snapshotsRef.current[snapshotsRef.current.length - 1];
      if (latest) {
        groupRef.current.position.copy(latest.position);
        groupRef.current.quaternion.copy(latest.quaternion);
        smoothedPosition.copy(latest.position);
        smoothedQuaternion.copy(latest.quaternion);
      } else {
        groupRef.current.position.set(
          playerData.position.x,
          playerData.position.y,
          playerData.position.z
        );
        groupRef.current.quaternion.set(
          playerData.quaternion.x,
          playerData.quaternion.y,
          playerData.quaternion.z,
          playerData.quaternion.w
        );
        smoothedPosition.copy(groupRef.current.position);
        smoothedQuaternion.copy(groupRef.current.quaternion);
      }
      return;
    }

    const currentTime = state.clock.elapsedTime;

    // Throttle updates for better performance
    if (currentTime - lastUpdateTime.current < UPDATE_THRESHOLD) return;
    lastUpdateTime.current = currentTime;

    // Time-based interpolation using snapshot buffer
    const now = performance.now();
    const renderTime = now - INTERP_DELAY_MS;

    const snapshots = snapshotsRef.current;
    // Ensure we have at least one snapshot
    if (snapshots.length > 0) {
      // Find bracketing snapshots
      let i = snapshots.length - 1;
      while (i > 0 && snapshots[i - 1].timeMs > renderTime) i--;

      const prev = snapshots[Math.max(i - 1, 0)];
      const next = snapshots[i];

      let samplePosition = next.position;
      let sampleQuaternion = next.quaternion;

      if (prev && next && next.timeMs !== prev.timeMs) {
        const t = THREE.MathUtils.clamp(
          (renderTime - prev.timeMs) / (next.timeMs - prev.timeMs),
          0,
          1
        );

        // Teleport detection
        const gapDist = prev.position.distanceTo(next.position);
        if (gapDist > TELEPORT_DISTANCE) {
          samplePosition = next.position;
          sampleQuaternion = next.quaternion;
          // On teleport, snap smoothed immediately to avoid slide/backtrack
          smoothedPosition.copy(samplePosition);
          smoothedQuaternion.copy(sampleQuaternion);
        } else {
          // Interpolate position and rotation
          samplePosition = prev.position.clone().lerp(next.position, t);
          sampleQuaternion = prev.quaternion.clone().slerp(next.quaternion, t);
        }
      }

      // Apply directly to match main character feel (no extra easing)
      smoothedPosition.copy(samplePosition);
      smoothedQuaternion.copy(sampleQuaternion);
    } else {
      // Fallback to last target
      smoothedPosition.copy(targetPosition);
      smoothedQuaternion.copy(targetQuaternion);
    }

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

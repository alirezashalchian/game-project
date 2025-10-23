import React, { useEffect, useRef } from "react";
import { Wall } from "../Wall/Wall";
import {
  generateWallConfigs,
  calculateRoomBoundaries,
  roomConfig,
} from "./roomConfig";

// Room-specific light component - OPTIMIZED: Reduced from 5 lights to 1 simple light
const RoomLight = () => {
  const lightRef = useRef();
  const targetRef = useRef();

  useEffect(() => {
    if (lightRef.current && targetRef.current) {
      lightRef.current.target = targetRef.current; // target becomes local to this room
    }
  }, []);

  return (
    <>
      <spotLight
        ref={lightRef}
        position={[0, 10, 0]}
        decay={0}
        penumbra={0.15}
        intensity={0.75}
        distance={roomConfig.innerSize * 1.6}
        angle={0.75}
        color="#ffffff"
      />
      <object3D ref={targetRef} position={[0, 0, 0]} /> {/* room center */}
    </>
  );
};

export const Room = React.memo(({ roomRef, roomId, position = [0, 0, 0], isActive = false }) => {
  // Generate wall configurations for this room (now with roomId for door logic)
  const wallConfigs = generateWallConfigs(roomId);

  // Store room info in ref for external access
  useEffect(() => {
    if (!roomRef) return;
    const boundaries = calculateRoomBoundaries(position);
    const info = {
      id: roomId,
      position,
      innerSize: roomConfig.innerSize,
      outerSize: roomConfig.outerSize,
      boundaries,
    };
    roomRef.current = info;
  }, [roomRef, roomId, position]);

  return (
    <group position={position}>
      {/* Room-specific lighting */}
      {isActive && <RoomLight />}

      {/* Walls */}
      {wallConfigs.map((config, index) => (
        <Wall
          key={`${roomId}-wall-${index}`}
          position={config.position}
          rotation={config.rotation}
          type={config.type}
          hasDoor={config.hasDoor}
          roomId={roomId}
        />
      ))}
    </group>
  );
});

import React, { useEffect } from "react";
import { Wall } from "../Wall/Wall";
import {
  generateWallConfigs,
  calculateRoomBoundaries,
  roomConfig,
} from "./roomConfig";

// Room-specific light component - OPTIMIZED: Reduced from 5 lights to 1 simple light
const RoomLight = () => (
  <>
    {/* Single directional light per room - much more performant */}
    <directionalLight
      position={[0, 10, 0]}
      intensity={0.4}
      color="#ffffff"
    />
  </>
);

export const Room = React.memo(({ roomRef, roomId, position = [0, 0, 0] }) => {
  // Generate wall configurations for this room (now with roomId for door logic)
  const wallConfigs = generateWallConfigs(roomId);

  // Calculate room boundaries
  const roomBoundaries = calculateRoomBoundaries(position);

  // Store room information
  const roomInfo = {
    id: roomId,
    position,
    innerSize: roomConfig.innerSize,
    outerSize: roomConfig.outerSize,
    boundaries: roomBoundaries,
  };

  // Store room info in ref for external access
  useEffect(() => {
    if (roomRef) {
      roomRef.current = roomInfo;
    }
  }, [roomRef, roomId, roomInfo]);

  return (
    <group position={position}>
      {/* Room-specific lighting */}
      <RoomLight />

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

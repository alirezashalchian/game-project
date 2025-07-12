import React, { useEffect } from "react";
import { Wall } from "../Wall/Wall";
import {
  generateWallConfigs,
  calculateRoomBoundaries,
  roomConfig,
} from "./roomConfig";

// Room-specific light component
const RoomLight = () => (
  <>
    {/* Main ambient lighting - soft overall illumination */}
    <ambientLight intensity={0.1} color="#f5f5f5" />

    {/* Primary ceiling light - simulates overhead lighting */}
    <pointLight
      position={[0, 6, 0]}
      intensity={0.6}
      color="#ffffff"
      castShadow
      distance={18}
      decay={1.5}
      shadow-mapSize-width={1024}
      shadow-mapSize-height={1024}
    />

    {/* Secondary corner lights for depth */}
    <pointLight
      position={[5, 3, 5]}
      intensity={0.3}
      color="#fff8dc"
      distance={12}
      decay={2}
    />

    <pointLight
      position={[-5, 3, -5]}
      intensity={0.3}
      color="#fff8dc"
      distance={12}
      decay={2}
    />

    {/* Floor accent light - subtle upward glow */}
    <pointLight
      position={[0, -6, 0]}
      intensity={0.2}
      color="#e6f3ff"
      distance={8}
      decay={2}
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

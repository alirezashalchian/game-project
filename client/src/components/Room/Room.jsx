import React, { useEffect, useRef } from "react";
import { Wall } from "../Wall/Wall";
import {
  generateWallConfigs,
  calculateRoomBoundaries,
  roomConfig,
  getAdjacentRoomId,
} from "./roomConfig";
import { useColyseus } from "@/context/ColyseusContext";

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

const MAX_PLAYERS_PER_ROOM = 2;

export const Room = React.memo(({ roomRef, roomId, position = [0, 0, 0], isActive = false }) => {
  const { currentPhysicalRoomId, roomCounts } = useColyseus();
  
  // Generate wall configurations for this room
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
      {wallConfigs.map((config, index) => {
        // 1. Get ID of the neighbor this wall leads to
        const adjacentRoomId = getAdjacentRoomId(roomId, config.type);
        
        // 2. Check if that neighbor is full
        const adjacentCount = (roomCounts && adjacentRoomId && roomCounts[adjacentRoomId]) || 0;
        const isAdjacentFull = adjacentCount >= MAX_PLAYERS_PER_ROOM;

        // 3. Determine if we should block the door
        // Logic: Block ONLY if neighbor is full AND we are NOT currently inside that neighbor.
        // If we are in Room A, and neighbor B is full, we block the door to B.
        // If we are in Room B (full), we do NOT block the door to A (even though A sees B as full).
        const shouldBlock = isAdjacentFull && (currentPhysicalRoomId !== adjacentRoomId);

        return (
          <Wall
            key={`${roomId}-wall-${index}`}
            position={config.position}
            rotation={config.rotation}
            type={config.type}
            hasDoor={config.hasDoor}
            roomId={roomId}
            isBlocked={shouldBlock}
          />
        );
      })}
    </group>
  );
});

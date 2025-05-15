import React from "react";
import { useRoom } from "./RoomContext";

export function GridSystem({ size = 15.5, cellSize = 0.5, visible = true }) {
  const { isPlacementMode } = useRoom();

  // Only show grid in placement mode
  if (!isPlacementMode || !visible) return null;

  // Room configuration from App.jsx
  const roomSize = size;
  const wallThickness = 0.5; // From ROOM_CONFIG.wallThickness

  // Calculate the floor position consistently with App.jsx
  const gridHeight = -roomSize / 2 + wallThickness / 2 + 0.01;

  // Calculate grid dimensions
  const gridSize = roomSize - wallThickness; // Inner space excluding walls
  const cellCount = Math.floor(gridSize / cellSize);

  return (
    <group position={[0, gridHeight, 0]} rotation={[0, 0, 0]}>
      {/* Main grid helper */}
      <gridHelper
        args={[gridSize, cellCount, "#888888", "#444444"]}
        position={[0, 0, 0]}
      />
    </group>
  );
}

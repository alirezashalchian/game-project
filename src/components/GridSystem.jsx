import React from "react";
import { useRoom } from "./RoomContext";
import { roomConfig } from "./Room/roomConfig";

export function GridSystem({
  size = roomConfig.innerSize,
  cellSize = roomConfig.cellSize,
  visible = true,
}) {
  const { isPlacementMode, currentRoom } = useRoom();

  // Only show grid in placement mode
  if (!isPlacementMode || !visible) return null;

  // Calculate the floor position based on current room
  const getFloorHeight = () => {
    if (!currentRoom) return 0;
    return (
      currentRoom.position[1] - roomConfig.innerSize / 2 + 0.01 // Small offset to prevent z-fighting
    );
  };

  // Get grid height based on current room
  const gridHeight = getFloorHeight();

  // Calculate grid dimensions
  const gridWidth = size - roomConfig.wallThickness; // Inner space excluding walls
  const cellCount = Math.floor(gridWidth / cellSize);

  return (
    <>
      {currentRoom && (
        <group
          position={[
            currentRoom.position[0],
            gridHeight,
            currentRoom.position[2],
          ]}
          rotation={[0, 0, 0]}
        >
          {/* Main grid helper */}
          <gridHelper
            args={[gridWidth, cellCount, "#888888", "#444444"]}
            position={[0, 0, 0]}
          />
        </group>
      )}
    </>
  );
}

import React from "react";
import { useRoom } from "./RoomContext";

export function SaveSystem() {
  const { placedModels, clearRoom, isRoomDataLoading, currentRoom } = useRoom();

  const handleClear = async () => {
    if (confirm("Are you sure you want to clear all blocks from this room?")) {
      try {
        await clearRoom();
        alert("Room cleared successfully!");
      } catch (error) {
        console.error("Clear failed:", error);
        alert("Failed to clear room");
      }
    }
  };

  return (
    <div className="save-system-ui">
      <button onClick={handleClear} className="clear-btn">
        Clear Room
      </button>

      <div className="info">
        <p>Room: {currentRoom?.id || "No room"}</p>
        <p>Blocks: {placedModels.length}</p>
        <p>✅ Auto-saves to Convex automatically</p>
        {isRoomDataLoading && <p>🔄 Loading room data...</p>}
      </div>
    </div>
  );
}

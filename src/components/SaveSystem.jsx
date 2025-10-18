import React from "react";
import { useRoom } from "./RoomContext";
import { Button } from "./ui/button";

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
      {/* Use the shadcn/ui Button, matching GravityChangeUI style */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
        <Button
          className="bg-purple-600 text-white hover:bg-purple-700"
          variant="outline"
          size="sm"
          onClick={handleClear}
        >
          Clear Room
        </Button>
      </div>

      <div className="info">
        <p>Room: {currentRoom?.id || "No room"}</p>
        <p>Blocks: {placedModels.length}</p>
        {isRoomDataLoading && <p>🔄 Loading room data...</p>}
      </div>
    </div>
  );
}

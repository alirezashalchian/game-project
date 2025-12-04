import React from "react";
import { useRoom } from "./RoomContext";
import { Trash2, Loader2 } from "lucide-react";

// Helper to format room ID nicely
function formatRoomId(id) {
  if (!id) return "---";
  // If it's like "room-4-4-4", extract the numbers
  const match = id.match(/room-(\d+)-(\d+)-(\d+)/i);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  // Fallback: just show the id
  return id;
}

export function SaveSystem() {
  const { placedModels, clearRoom, isRoomDataLoading, currentRoom } = useRoom();

  const handleClear = async () => {
    if (confirm("⚠️ DELETE ALL BLOCKS?\n\nThis cannot be undone!")) {
      try {
        await clearRoom();
      } catch (error) {
        console.error("Clear failed:", error);
        alert("❌ Failed to clear room");
      }
    }
  };

  return (
    <div className="roominfo-ui-wrapper fixed bottom-6 left-6 z-50">
      <div 
        className="roominfo-ui-panel retro-panel retro-scanlines animate-slide-up"
        style={{ padding: 0 }}
      >
        {/* Stats Header */}
        <div 
          className="flex items-center gap-4 px-4 py-3"
          style={{ borderBottom: '2px solid var(--retro-border)' }}
        >
          {/* Room ID */}
          <div className="retro-stat">
            <span className="retro-stat__label">ROOM</span>
            <span 
              className="retro-stat__value" 
              style={{ 
                color: 'var(--retro-cyan)',
                textShadow: 'var(--glow-cyan)',
                fontSize: '12px'
              }}
            >
              {formatRoomId(currentRoom?.id)}
            </span>
          </div>

          {/* Block Count */}
          <div className="retro-stat">
            <span className="retro-stat__label">BLOCKS</span>
            <span className="retro-stat__value">
              {placedModels.length}
            </span>
          </div>

          {/* Loading Indicator */}
          {isRoomDataLoading && (
            <div className="retro-badge retro-badge--active">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>SYNC</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-3">
          <button
            className="retro-btn retro-btn--danger w-full flex items-center justify-center gap-2"
            onClick={handleClear}
          >
            <Trash2 size={14} />
            <span>CLEAR ROOM</span>
          </button>
        </div>
      </div>
    </div>
  );
}

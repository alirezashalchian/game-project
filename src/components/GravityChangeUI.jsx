import { useEffect } from "react";
import { useCharacter } from "./CharacterContext";

export function GravityChangeUI() {
  const { wallTouchData, handleGravityChange } = useCharacter();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === "g" && wallTouchData) {
        console.log(
          `[GravityChangeUI] G key pressed, triggering gravity change to: ${wallTouchData.wallType}`
        );
        handleGravityChange(wallTouchData.wallType);
      }
      if (e.key === "Escape" && wallTouchData) {
        // Clear wall touch data on escape
        // Note: handleGravityCancel functionality can be added to context if needed
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [wallTouchData, handleGravityChange]);

  if (!wallTouchData) return null;

  const getWallDisplayName = (wallType) => {
    const names = {
      front: "front wall",
      back: "back wall",
      right: "right wall",
      left: "left wall",
      top: "ceiling",
    };
    return names[wallType] || wallType;
  };

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-black/40 backdrop-blur-md border border-gray-700 rounded-2xl px-6 py-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
        <p className="text-white text-center mb-3">
          Press{" "}
          <span className="bg-purple-600 px-2 py-1 rounded font-bold">G</span>{" "}
          to change gravity to the{" "}
          <span className="text-purple-400 font-medium">
            {getWallDisplayName(wallTouchData.wallType)}
          </span>
        </p>
        <p className="text-gray-400 text-sm text-center">Press ESC to cancel</p>
      </div>
    </div>
  );
}

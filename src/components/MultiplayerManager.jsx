import React from "react";
import { useColyseus } from "@/context/ColyseusContext";
import OtherPlayer from "./OtherPlayer";

export default function MultiplayerManager() {
  const { players, currentSessionId, isConnected } = useColyseus();

  if (!isConnected) {
    return null;
  }

  return (
    <>
      {Array.from(players.entries()).map(([sessionId, playerData]) => {
        // Don't render the local player
        if (sessionId === currentSessionId) {
          return null;
        }

        return (
          <group name="multiplayer-players">
            <OtherPlayer
              key={sessionId}
              sessionId={sessionId}
              playerData={playerData}
            />
          </group>
        );
      })}
    </>
  );
}

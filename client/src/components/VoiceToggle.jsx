import React from "react";
import { useHuddleAudio } from "@/context/HuddleAudioContext";
import { Button } from "./ui/button";

export default function VoiceToggle() {
  const { micEnabled, startMic, stopMic, error } = useHuddleAudio();
  
  const handleClick = async () => {
    if (micEnabled) {
      stopMic();
    } else {
      await startMic();
    }
  };

  return (
    <div style={{ position: "fixed", right: 16, bottom: 16, zIndex: 1000 }}>
      <Button onClick={handleClick}>
        {micEnabled ? "Disable Mic" : "Enable Mic"}
      </Button>
      {error ? (
        <div style={{ marginTop: 8, color: "#f87171", fontSize: 12 }}>Voice error: {String(error)}</div>
      ) : null}
    </div>
  );
}

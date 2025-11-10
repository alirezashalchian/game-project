import React, { useEffect, useRef } from "react";
import { useHuddleAudio } from "@/context/HuddleAudioContext";
import { usePeerIds } from "@huddle01/react/hooks";
import { Button } from "./ui/button";

export default function VoiceToggle() {
  const { micEnabled, startMic, stopMic, error } = useHuddleAudio();
  const { peerIds } = usePeerIds();
  const { peerIds: audioPeerIds } = usePeerIds({ labels: ["audio"] });
  const { peerIds: speakerPeerIds } = usePeerIds({ roles: ["speaker"] });

  const latestPeerIdsRef = useRef([]);
  useEffect(() => {
    latestPeerIdsRef.current = peerIds;
  }, [peerIds]);

  const handleClick = async () => {
    if (micEnabled) {
      stopMic();
    } else {
      console.log("[Huddle][client] peerIds before enabling mic:", peerIds);
      await startMic();
      console.log("[Huddle][client] peerIds immediately after enabling mic (latest ref):", latestPeerIdsRef.current);
      setTimeout(() => {
        console.log("[Huddle][client] peerIds 500ms after enabling mic (latest ref):", latestPeerIdsRef.current);
      }, 500);
    }
  };

  useEffect(() => {
    if (micEnabled) {
      console.log("[Huddle][client] peerIds (on micEnabled change):", peerIds);
    }
  }, [micEnabled, peerIds]);

  useEffect(() => {
    console.log("[Huddle][client] peerIds(all):", peerIds);
    console.log("[Huddle][client] peerIds(labels:audio):", audioPeerIds);
    console.log("[Huddle][client] peerIds(roles:speaker):", speakerPeerIds);
  }, [peerIds, audioPeerIds, speakerPeerIds]);

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

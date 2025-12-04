import React, { useRef, useEffect } from "react";
import { usePeerIds, useRemoteAudio } from "@huddle01/react/hooks";

function RemotePeerAudio({ peerId }) {
  const { stream } = useRemoteAudio({ peerId });
  const audioRef = useRef(null);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

      if (el.srcObject !== stream) {
        el.srcObject = stream || null;
      }
      if (stream) {
        el.autoplay = true;
        el.playsInline = true;
        el.muted = false;
        el.play().catch(() => {});
      }

    return () => {
      if (el && el.srcObject) el.srcObject = null;
    };
  }, [stream]);

  return <audio ref={audioRef} playsInline />;
}

export default function RemoteAudio() {
  const { peerIds: audioPeerIds } = usePeerIds({ labels: ["audio"] });

  // Just render the audio elements - UI is handled by VoiceToggle
  return (
    <>
      {audioPeerIds.map((pid) => (
        <RemotePeerAudio key={pid} peerId={pid} />
      ))}
    </>
  );
}

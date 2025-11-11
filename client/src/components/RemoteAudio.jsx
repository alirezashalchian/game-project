import React, { useRef, useEffect, useState, useCallback } from "react";
import { usePeerIds, useRemoteAudio } from "@huddle01/react/hooks";

function RemotePeerAudio({ peerId, unlocked }) {
  const { stream } = useRemoteAudio({ peerId });
  const audioRef = useRef(null);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const tryPlay = () => {
      if (el.srcObject !== stream) {
        el.srcObject = stream || null;
      }
      if (stream) {
        el.autoplay = true;
        el.playsInline = true;
        el.muted = false;
        el.play().catch(() => {});
      }
    };

    // Attempt on stream mount/change and whenever unlock toggles true
    tryPlay();

    return () => {
      if (el && el.srcObject) el.srcObject = null;
    };
  }, [stream, unlocked]);

  // Always render the audio element; it will only play when stream exists
  return <audio ref={audioRef} playsInline />;
}

export default function RemoteAudio() {
  const [unlocked, setUnlocked] = useState(false);
  const manualUnlock = useCallback(() => {
    setUnlocked(true);
    const audios = Array.from(document.querySelectorAll("audio"));
    audios.forEach((el) => {
      try {
        el.autoplay = true;
        el.playsInline = true;
        el.muted = false;
        el.play().catch(() => {});
      } catch {
        // ignore errors from blocked play attempts
      }
    });
  }, []);
  // Explicit button unlock only; remove global gesture listeners for simpler UX

  // Only render publishers; don't mount components for non-publishers
  const { peerIds: audioPeerIds } = usePeerIds({ labels: ["audio"] });
  return (
    <>
      {!unlocked ? (
        <div style={{ position: "fixed", left: 16, bottom: 16, zIndex: 1000 }}>
          <button
            onClick={manualUnlock}
            style={{
              background: "rgba(0,0,0,0.7)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Enable audio
          </button>
        </div>
      ) : null}
      {audioPeerIds.map((pid) => (
        <RemotePeerAudio key={pid} peerId={pid} unlocked={unlocked} />
      ))}
    </>
  );
}


//Sink not implemented yet. (Sink means which audio output device to use.)


// Ask AJ to check this component out and test it on the browser. also show him the huddle01 Audio component version.
//huddle01 Audio component version: import React from "react";
// import { usePeerIds, useRemoteAudio } from "@huddle01/react/hooks";
// import { Audio } from "@huddle01/react/components";

// function RemotePeerAudio({ peerId }) {
//   const { stream } = useRemoteAudio({
//     peerId,
//     onPlayable: () => {},
//     onClose: () => {},
//   });

//   return (
//     <>
//       {stream ? <Audio stream={stream} /> : null}
//     </>
//   );
// }

// export default function RemoteAudio() {
//   const { peerIds } = usePeerIds();
//   const { peerIds: audioPeerIds } = usePeerIds({ labels: ["audio"] });
//   return (
//     <>
//       {(audioPeerIds.length ? audioPeerIds : peerIds).map((pid) => (
//         <RemotePeerAudio key={pid} peerId={pid} />
//       ))}
//     </>
//   );
// } 
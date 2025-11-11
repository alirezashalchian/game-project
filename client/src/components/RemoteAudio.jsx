import React, { useRef, useEffect } from "react";
import { usePeerIds, useRemoteAudio } from "@huddle01/react/hooks";

function RemotePeerAudio({ peerId }) {
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

    // Attempt immediately on stream mount/change
    tryPlay();

    // Retry on user gesture to satisfy autoplay policy
    const onGesture = () => tryPlay();
    window.addEventListener("pointerdown", onGesture);
    window.addEventListener("keydown", onGesture);

    return () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
      if (el && el.srcObject) el.srcObject = null;
    };
  }, [stream]);

  // Always render the audio element; it will only play when stream exists
  return <audio ref={audioRef} />;
}

export default function RemoteAudio() {
  const { peerIds } = usePeerIds();
  const { peerIds: audioPeerIds } = usePeerIds({ labels: ["audio"] });
  return (
    <>
      {(audioPeerIds.length ? audioPeerIds : peerIds).map((pid) => (
        <RemotePeerAudio key={pid} peerId={pid} />
      ))}
    </>
  );
}


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
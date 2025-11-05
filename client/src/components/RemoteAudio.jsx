import React, { useEffect, useRef } from "react";
import { usePeerIds, useRemoteAudio } from "@huddle01/react/hooks";
import { Audio } from "@huddle01/react/components";

function RemotePeerAudio({ peerId }) {
  const { stream, state, isAudioOn: remoteIsAudioOn } = useRemoteAudio({
    peerId,
    onPlayable: ({ stream: s, track, label }) => {
      console.log("[Huddle][client] onPlayable", { peerId, label, hasStream: !!s, kind: track?.kind });
    },
    onClose: (reason) => {
      console.log("[Huddle][client] remote audio closed", { peerId, reason });
    },
  });
  const elRef = useRef(null);

  useEffect(() => {
    if (!stream) return;
    console.log("[Huddle][client] remote audio stream ready for peer", peerId, {
      tracks: stream.getAudioTracks().length,
      state,
      remoteIsAudioOn,
    });
    const el = elRef.current;
    if (!el) return;
    el.srcObject = stream;
    const play = async () => {
      try {
        await el.play();
        console.log("[Huddle][client] remote audio playing for", peerId);
      } catch (e) {
        console.warn("[Huddle][client] remote audio play error", e);
      }
    };
    play();
  }, [stream, peerId, state, remoteIsAudioOn]);

  return (
    <>
      {/* Huddle Audio component (optional) */}
      {stream ? <Audio stream={stream} /> : null}
      {/* Manual audio element for explicit playback & logging */}
     
    </>
  );
}

export default function RemoteAudio() {
  const { peerIds } = usePeerIds();
  useEffect(() => {
    console.log("[Huddle][client] peerIds", peerIds);
  }, [peerIds]);
  return (
    <>
      {peerIds.map((pid) => (
        <RemotePeerAudio key={pid} peerId={pid} />
      ))}
    </>
  );
}



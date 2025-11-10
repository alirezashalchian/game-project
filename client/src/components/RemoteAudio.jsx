import React from "react";
import { usePeerIds, useRemoteAudio } from "@huddle01/react/hooks";
import { Audio } from "@huddle01/react/components";

function RemotePeerAudio({ peerId }) {
  const { stream } = useRemoteAudio({
    peerId,
    onPlayable: () => {},
    onClose: () => {},
  });

  return (
    <>
      {stream ? <Audio stream={stream} /> : null}
    </>
  );
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



import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useColyseus } from "@/context/ColyseusContext";
// Placeholder imports; adjust to the actual Huddle01 React APIs you installed
import { useRoom, useLocalAudio } from "@huddle01/react/hooks";

const HuddleAudioContext = createContext(null);
export const useHuddleAudio = () => {
  const ctx = useContext(HuddleAudioContext);
  if (!ctx) throw new Error("useHuddleAudio must be used within HuddleAudioProvider");
  return ctx;
};

export default function HuddleAudioProvider({ children }) {
  const { currentPhysicalRoomId, isConnected } = useColyseus();
  const [joinedRoomId, setJoinedRoomId] = useState(null);
  const [micEnabled, setMicEnabled] = useState(false);
  const [error, setError] = useState(null);

  const joinedRef = useRef(false);
  const { joinRoom, leaveRoom, state: roomState } = useRoom({
    onJoin: () => {
      joinedRef.current = true;
    },
    onLeave: () => {
      joinedRef.current = false;
    },
  });
  const {
    stream: localStream,
    track: localTrack,
    isAudioOn,
    enableAudio,
    disableAudio,
  } = useLocalAudio({
    onProduceStart: (producer) => console.log("[Huddle][client] onProduceStart", { id: producer?.id, label: producer?.appData?.label }),
    onProduceClose: (label) => console.log("[Huddle][client] onProduceClose", label),
    onProduceError: (err) => console.warn("[Huddle][client] onProduceError", err),
  });

  const huddleRoomId = useMemo(() => {
    if (!currentPhysicalRoomId) return null;
    return `h-${currentPhysicalRoomId}`; // e.g., h-room-4-4-4
  }, [currentPhysicalRoomId]);

  const fetchJoinToken = useCallback(async (roomId, role) => {
    const res = await fetch("/api/huddle/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ huddleRoomId: roomId, role }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "token error");
    return { token: data.token, roomId: data.roomId || roomId };
  }, []);
  const pendingRef = useRef(false);

  // Log local capture state
  useEffect(() => {
    // Removed console logs for localStream and localTrack
  }, [localStream, localTrack, isAudioOn]);

  // Join/leave on physical room changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!isConnected || !huddleRoomId || pendingRef.current) return;
        pendingRef.current = true;

        if (roomState?.joined) {
          try { await leaveRoom(); } catch { /* noop */ }
          setJoinedRoomId(null);
          setMicEnabled(false);
        }
        const { token, roomId } = await fetchJoinToken(huddleRoomId, "speaker");
        if (cancelled) return;

        await joinRoom({ roomId, token });
        if (cancelled) return;
        // wait until fully joined so peers can discover us
        for (let i = 0; i < 50 && !joinedRef.current && !cancelled; i++) {
          await new Promise((r) => setTimeout(r, 100));
        }
        setJoinedRoomId(huddleRoomId);
        pendingRef.current = false;
      } catch (e) {
        if (!cancelled) {
          console.warn("[Huddle][client] speaker(default) join error", e);
          setError(e?.message || String(e));
        }
        pendingRef.current = false;
      }
    })();
    return () => { cancelled = true; };
  }, [isConnected, huddleRoomId, joinRoom, leaveRoom, fetchJoinToken, roomState?.joined]);

  const startMic = useCallback(async () => {
    try {
      // Already joined as speaker by default; only enable local mic
      if (!isAudioOn) {
        await enableAudio();
      }
      setMicEnabled(true);
    } catch (e) {
      console.warn("[Huddle][client] startMic error", e);
      setError(e?.message || String(e));
    }
  }, [enableAudio, isAudioOn]);

  const stopMic = useCallback(async () => {
    try {
      if (!micEnabled) return;
      if (isAudioOn) {
        await disableAudio();
      } else {
        // skipped
      }
      setMicEnabled(false);
    } catch (e) { setError(e?.message || String(e)); }
  }, [disableAudio, micEnabled, isAudioOn]);

  useEffect(() => {
    // Removed console logs for roomState update
  }, [roomState]);

  const value = { joinedRoomId, micEnabled, startMic, stopMic, error };
  return <HuddleAudioContext.Provider value={value}>{children}</HuddleAudioContext.Provider>;
}

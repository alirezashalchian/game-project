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
      console.log("[Huddle][client] onJoin fired");
      joinedRef.current = true;
    },
    onLeave: () => {
      console.log("[Huddle][client] onLeave fired");
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
    console.log("[Huddle][client] fetchJoinToken", { roomId, role });
    const res = await fetch("/api/huddle/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ huddleRoomId: roomId, role }),
    });
    const data = await res.json();
    console.log("[Huddle][client] token response status", res.status, "keys:", Object.keys(data || {}));
    if (!res.ok) throw new Error(data.error || "token error");
    return { token: data.token, roomId: data.roomId || roomId };
  }, []);
  const pendingRef = useRef(false);

  // Log local capture state
  useEffect(() => {
    if (localStream) {
      console.log("[Huddle][client] localStream tracks", {
        audio: localStream.getAudioTracks().length,
        video: localStream.getVideoTracks().length,
        isAudioOn,
      });
    } else {
      console.log("[Huddle][client] localStream is null", { isAudioOn });
    }
    if (localTrack) {
      console.log("[Huddle][client] localTrack ready", { enabled: localTrack.enabled, kind: localTrack.kind });
    }
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
        console.log("[Huddle][client] requesting token for", huddleRoomId, "role: listener");
        const { token, roomId } = await fetchJoinToken(huddleRoomId, "listener");
        if (cancelled) return;

        console.log("[Huddle][client] joining room (listener)", { roomId, tokenLen: token?.length });
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
          console.warn("[Huddle][client] listener join error", e);
          setError(e?.message || String(e));
        }
        pendingRef.current = false;
      }
    })();
    return () => { cancelled = true; };
  }, [isConnected, huddleRoomId, joinRoom, leaveRoom, fetchJoinToken, roomState?.joined]);

  const startMic = useCallback(async () => {
    try {
      if (!huddleRoomId) return;
      // fetch speaker token and re-join with produce permissions
      const { token, roomId } = await fetchJoinToken(huddleRoomId, "speaker");
      try { await leaveRoom(); } catch { /* noop */ }
      console.log("[Huddle][client] re-joining room (speaker)", { roomId, tokenLen: token?.length });
      await joinRoom({ roomId, token });
      // wait until fully joined as speaker before enabling mic
      for (let i = 0; i < 50 && !joinedRef.current; i++) {
        await new Promise((r) => setTimeout(r, 100));
      }
      if (!isAudioOn) {
        console.log("[Huddle][client] enabling audio (mic) ...");
        await enableAudio();
      }
      console.log("[Huddle][client] mic enabled?", true);
      setMicEnabled(true);
    } catch (e) {
      console.warn("[Huddle][client] startMic error", e);
      setError(e?.message || String(e));
    }
  }, [huddleRoomId, fetchJoinToken, leaveRoom, joinRoom, enableAudio, isAudioOn]);

  const stopMic = useCallback(async () => {
    try {
      if (!micEnabled) return;
      if (isAudioOn) {
        console.log("[Huddle][client] disabling audio (mic) ...");
        await disableAudio();
      } else {
        console.log("[Huddle][client] disableAudio skipped (isAudioOn=false)");
      }
      setMicEnabled(false);
    } catch (e) { setError(e?.message || String(e)); }
  }, [disableAudio, micEnabled, isAudioOn]);

  useEffect(() => {
    // log basic state transitions for diagnosis
    if (roomState?.joined) {
      console.log("[Huddle][client] joined room state");
    }
  }, [roomState?.joined]);

  const value = { joinedRoomId, micEnabled, startMic, stopMic, error };
  return <HuddleAudioContext.Provider value={value}>{children}</HuddleAudioContext.Provider>;
}

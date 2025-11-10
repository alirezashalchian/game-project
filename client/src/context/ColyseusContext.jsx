import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { Client } from "colyseus.js";
import { getRoomId } from "../utils/roomUtils";

const ColyseusContext = createContext();

export const useColyseus = () => {
  const context = useContext(ColyseusContext);
  if (!context) {
    throw new Error("useColyseus must be used within a ColyseusProvider");
  }
  return context;
};

export const ColyseusProvider = ({ children }) => {
  const [currentRoom, setCurrentRoom] = useState(null);
  const [players, setPlayers] = useState(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [currentPhysicalRoomId, setCurrentPhysicalRoomId] = useState(null);

  const clientRef = useRef(null);
  const updateQueueRef = useRef([]);
  const lastUpdateRef = useRef(0);
  const pendingRoomSwitch = useRef(false);
  const playerIdRef = useRef(null);
  const currentRoomRef = useRef(null);
  const currentPhysicalRoomIdRef = useRef(null);
  const isConnectedRef = useRef(false);

  // Initialize client only once
  useEffect(() => {
    const client = new Client("ws://localhost:2567");
    clientRef.current = client;

    // Initialize stable playerId per TAB (use sessionStorage, not localStorage)
    try {
      const key = "playerId";
      const existing = sessionStorage.getItem(key);
      if (existing) {
        playerIdRef.current = existing;
      } else {
        const id = `p_${Math.random().toString(36).slice(2)}_${Date.now()}`;
        sessionStorage.setItem(key, id);
        playerIdRef.current = id;
      }
    } catch (e) {
      console.warn("Failed to init playerId in sessionStorage", e);
    }

    return () => {
      const room = currentRoomRef.current;
      if (room) {
        try { room.leave(); } catch (e) { console.warn("Error leaving room on unmount", e); }
      }
    };
  }, []);

  // Function to connect to a specific room - stabilized with useCallback
  const connectToRoom = useCallback(async (physicalRoomCoords) => {
    if (!clientRef.current) {
      return;
    }

    const roomId = getRoomId(physicalRoomCoords);

    // debug logs removed

    // Prevent duplicate connections
    if (pendingRoomSwitch.current) {
      return;
    }

    // If already in this room and connected, don't reconnect
    if (
      currentPhysicalRoomIdRef.current === roomId &&
      currentRoomRef.current &&
      isConnectedRef.current
    ) {
      return;
    }

    try {
      pendingRoomSwitch.current = true;
      setIsConnected(false);

      // Leave current room if exists
      if (currentRoomRef.current) {
        try {
          await currentRoomRef.current.leave();
          // Ensure no lingering handlers on old room
          try { currentRoomRef.current.removeAllListeners(); } catch (e) {
            console.warn("Error removing listeners from old room", e);
          }
        } catch (error) {
          console.warn("Error leaving room:", error);
        }
        setCurrentRoom(null);
        currentRoomRef.current = null;
        setPlayers(new Map());
        setCurrentSessionId(null);
      }

      // Single join attempt to avoid background connections creating ghost sessions
      const room = await clientRef.current.joinOrCreate("dynamic_room", {
        physicalRoomId: roomId,
        roomCoords: physicalRoomCoords,
        playerId: playerIdRef.current,
      });

      setCurrentRoom(room);
      currentRoomRef.current = room;
      setCurrentSessionId(room.sessionId);
      setCurrentPhysicalRoomId(roomId);
      currentPhysicalRoomIdRef.current = roomId;
      setIsConnected(true);
      isConnectedRef.current = true;
      pendingRoomSwitch.current = false;

      // connected

      // Listen to state changes
      room.onStateChange((state) => {
        if (state && state.players) {
          const currentPlayers = new Map();

          for (const [sessionId, player] of state.players) {
            if (player) {
              currentPlayers.set(sessionId, {
                sessionId: player.sessionId || sessionId,
                position: {
                  x: player.x || 0,
                  y: player.y || 0,
                  z: player.z || 0,
                },
                quaternion: {
                  x: player.qx || 0,
                  y: player.qy || 0,
                  z: player.qz || 0,
                  w: player.qw || 1,
                },
                gravity: [
                  player.gravityX || 0,
                  player.gravityY || -9.8,
                  player.gravityZ || 0,
                ],
                floorSurface: player.floorSurface || "bottom",
                animation: player.currentAnimation || "Idle",
                roomCoords: [
                  player.roomX || 4,
                  player.roomY || 4,
                  player.roomZ || 4,
                ],
              });
            }
          }

          setPlayers(currentPlayers);
        }
      });

      // Handle connection errors
      room.onError((code, message) => {
        console.error("Room error:", code, message);
        setIsConnected(false);
        isConnectedRef.current = false;
        pendingRoomSwitch.current = false;
      });

      // Handle room leave
      room.onLeave((code) => {
        console.log("Left room with code:", code);
        setIsConnected(false);
        isConnectedRef.current = false;
        if (pendingRoomSwitch.current) {
          // Only reset pending if this was expected
          pendingRoomSwitch.current = false;
        }
      });

      // Handle room info message
      room.onMessage("roomInfo", (message) => {
        console.log("Room info received:", message);
      });

      // Server-driven room transition
      room.onMessage("roomTransitionRequired", (message) => {
        if (!message || !message.targetRoomCoords) return;
        connectToRoom(message.targetRoomCoords);
      });

      room.onMessage("duplicateSession", () => {
        try {
          room.leave();
        } catch (e) {
          console.warn("Error leaving room after duplicateSession", e);
        }
      });
    } catch (error) {
      console.error("Failed to connect to room:", roomId, error);
      setIsConnected(false);
      isConnectedRef.current = false;
      pendingRoomSwitch.current = false;
    }
  }, []); // Empty dependency array to prevent recreation

  // Initial connection is handled by RoomContext via handleRoomTransition

  // Throttled update sender (30fps max)
  useEffect(() => {
    const sendUpdates = () => {
      const now = Date.now();
      if (now - lastUpdateRef.current >= 33) {
        if (
          updateQueueRef.current.length > 0 &&
          currentRoom &&
          isConnected &&
          !pendingRoomSwitch.current
        ) {
          const latestUpdate =
            updateQueueRef.current[updateQueueRef.current.length - 1];
          currentRoom.send("playerUpdate", latestUpdate);
          updateQueueRef.current = [];
          lastUpdateRef.current = now;
        }
      }
    };

    const interval = setInterval(sendUpdates, 33);
    return () => clearInterval(interval);
  }, [currentRoom, isConnected]);

  const sendPlayerUpdate = useCallback(
    (updateData) => {
      if (isConnected && currentRoom && !pendingRoomSwitch.current) {
        updateQueueRef.current.push(updateData);
      }
    },
    [isConnected, currentRoom]
  );

  // Room transition handler - uses ref to get current values
  const handleRoomTransition = useCallback(
    (newRoomCoords) => {
      const newRoomId = getRoomId(newRoomCoords);
      const currentRoomId = currentPhysicalRoomIdRef.current;

      if (newRoomId !== currentRoomId && !pendingRoomSwitch.current) {
        connectToRoom(newRoomCoords);
      }
    },
    [connectToRoom]
  );

  const value = {
    room: currentRoom,
    players,
    isConnected,
    currentSessionId,
    currentPhysicalRoomId,
    sendPlayerUpdate,
    handleRoomTransition,
    connectToRoom,
  };

  return (
    <ColyseusContext.Provider value={value}>
      {children}
    </ColyseusContext.Provider>
  );
};

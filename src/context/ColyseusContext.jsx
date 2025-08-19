import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { Client } from "colyseus.js";

const ColyseusContext = createContext();

export const useColyseus = () => {
  const context = useContext(ColyseusContext);
  if (!context) {
    throw new Error("useColyseus must be used within a ColyseusProvider");
  }
  return context;
};

export const ColyseusProvider = ({ children }) => {
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const clientRef = useRef(null);
  const updateQueueRef = useRef([]);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    const connect = async () => {
      try {
        const client = new Client("ws://localhost:2567");
        clientRef.current = client;

        const room = await client.joinOrCreate("my_room", {});
        setRoom(room);
        setCurrentSessionId(room.sessionId);
        setIsConnected(true);
        console.log("Connected to room:", room.sessionId);

        // Listen to all state changes - this handles everything
        room.onStateChange((state) => {
          if (state && state.players) {
            const currentPlayers = new Map();

            // Convert the MapSchema to our local Map
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
        });

        // Handle room leave
        room.onLeave((code) => {
          console.log("Left room with code:", code);
          setIsConnected(false);
        });
      } catch (error) {
        console.error("Failed to connect to server:", error);
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      if (room) {
        room.leave();
      }
    };
  }, []);

  // Throttled update sender (30fps max)
  useEffect(() => {
    const sendUpdates = () => {
      const now = Date.now();
      if (now - lastUpdateRef.current >= 33) {
        // ~30fps
        if (updateQueueRef.current.length > 0 && room && isConnected) {
          const latestUpdate =
            updateQueueRef.current[updateQueueRef.current.length - 1];
          room.send("playerUpdate", latestUpdate);
          updateQueueRef.current = [];
          lastUpdateRef.current = now;
        }
      }
    };

    const interval = setInterval(sendUpdates, 33); // ~30fps
    return () => clearInterval(interval);
  }, [room, isConnected]);

  const sendPlayerUpdate = (updateData) => {
    if (isConnected && room) {
      updateQueueRef.current.push(updateData);
    }
  };

  const value = {
    room,
    players,
    isConnected,
    currentSessionId,
    sendPlayerUpdate,
  };

  return (
    <ColyseusContext.Provider value={value}>
      {children}
    </ColyseusContext.Provider>
  );
};

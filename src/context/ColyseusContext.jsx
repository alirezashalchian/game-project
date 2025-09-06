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
  const connectionTimeoutRef = useRef(null);

  // Initialize client only once
  useEffect(() => {
    const client = new Client("ws://localhost:2567");
    clientRef.current = client;

    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      if (currentRoom) {
        currentRoom.leave();
      }
    };
  }, []);

  // Function to connect to a specific room - stabilized with useCallback
  const connectToRoom = useCallback(async (physicalRoomCoords) => {
    if (!clientRef.current) {
      console.warn("Client not initialized yet");
      return;
    }

    const roomId = getRoomId(physicalRoomCoords);

    console.log("DEBUG - connectToRoom called with:", physicalRoomCoords);
    console.log("DEBUG - roomId:", roomId);
    console.log("DEBUG - currentPhysicalRoomId:", currentPhysicalRoomId);
    console.log("DEBUG - pendingRoomSwitch:", pendingRoomSwitch.current);

    // Prevent duplicate connections
    if (pendingRoomSwitch.current) {
      console.log("Room switch already pending, ignoring request");
      return;
    }

    // If already in this room and connected, don't reconnect
    if (currentPhysicalRoomId === roomId && currentRoom && isConnected) {
      console.log("Already connected to this room, ignoring request");
      return;
    }

    try {
      pendingRoomSwitch.current = true;
      setIsConnected(false);

      // Clear any existing connection timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }

      // Leave current room if exists
      if (currentRoom) {
        console.log("Leaving current room:", currentPhysicalRoomId);
        try {
          await currentRoom.leave();
        } catch (error) {
          console.warn("Error leaving room:", error);
        }
        setCurrentRoom(null);
        setPlayers(new Map());
        setCurrentSessionId(null);
      }

      console.log("Attempting to connect to room:", roomId);

      // Add connection timeout
      const timeoutPromise = new Promise((_, reject) => {
        connectionTimeoutRef.current = setTimeout(() => {
          reject(new Error("Connection timeout"));
        }, 10000); // 10 second timeout
      });

      // Race between connection and timeout
      const room = await Promise.race([
        clientRef.current.joinOrCreate("dynamic_room", {
          physicalRoomId: roomId,
          roomCoords: physicalRoomCoords,
        }),
        timeoutPromise,
      ]);

      // Clear timeout on successful connection
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }

      setCurrentRoom(room);
      setCurrentSessionId(room.sessionId);
      setCurrentPhysicalRoomId(roomId);
      setIsConnected(true);
      pendingRoomSwitch.current = false;

      console.log(
        "Successfully connected to room:",
        room.sessionId,
        "Physical room:",
        roomId
      );

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
        pendingRoomSwitch.current = false;
      });

      // Handle room leave
      room.onLeave((code) => {
        console.log("Left room with code:", code);
        setIsConnected(false);
        if (pendingRoomSwitch.current) {
          // Only reset pending if this was expected
          pendingRoomSwitch.current = false;
        }
      });

      // Handle room info message
      room.onMessage("roomInfo", (message) => {
        console.log("Room info received:", message);
      });
    } catch (error) {
      console.error("Failed to connect to room:", roomId, error);
      setIsConnected(false);
      pendingRoomSwitch.current = false;

      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
    }
  }, []); // Empty dependency array to prevent recreation

  // Initial connection - separate effect with no dependencies on connectToRoom
  useEffect(() => {
    let mounted = true;

    const initializeConnection = async () => {
      if (!clientRef.current) return;

      // Wait a bit for client to be ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (mounted) {
        const initialRoomCoords = [4, 4, 4];
        const roomId = getRoomId(initialRoomCoords);

        try {
          pendingRoomSwitch.current = true;
          const room = await clientRef.current.joinOrCreate("dynamic_room", {
            physicalRoomId: roomId,
            roomCoords: initialRoomCoords,
          });

          if (mounted) {
            setCurrentRoom(room);
            setCurrentSessionId(room.sessionId);
            setCurrentPhysicalRoomId(roomId);
            setIsConnected(true);
            pendingRoomSwitch.current = false;

            console.log(
              "Initial connection successful:",
              room.sessionId,
              "Physical room:",
              roomId
            );

            // Set up event handlers
            room.onStateChange((state) => {
              if (!mounted) return;

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

            room.onError((code, message) => {
              console.error("Room error:", code, message);
              if (mounted) {
                setIsConnected(false);
                pendingRoomSwitch.current = false;
              }
            });

            room.onLeave((code) => {
              console.log("Left room with code:", code);
              if (mounted) {
                setIsConnected(false);
              }
            });

            room.onMessage("roomInfo", (message) => {
              console.log("Room info received:", message);
            });
          }
        } catch (error) {
          console.error("Initial connection failed:", error);
          if (mounted) {
            pendingRoomSwitch.current = false;
          }
        }
      }
    };

    initializeConnection();

    return () => {
      mounted = false;
    };
  }, []); // Only run once on mount

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
      const currentRoomId = currentPhysicalRoomId;

      console.log("handleRoomTransition called:", {
        newRoomCoords,
        newRoomId,
        currentRoomId,
        pending: pendingRoomSwitch.current,
      });

      if (newRoomId !== currentRoomId && !pendingRoomSwitch.current) {
        console.log(
          "Room transition triggered:",
          currentRoomId,
          "->",
          newRoomId
        );
        connectToRoom(newRoomCoords);
      }
    },
    [connectToRoom, currentPhysicalRoomId]
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

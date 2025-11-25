import { Room, Client } from "colyseus";
import { MyRoomState, Player } from "./schema/MyRoomState";

export class MyRoom extends Room<MyRoomState> {
  maxClients = 2; // Increased since rooms are smaller now
  physicalRoomId: string;
  roomCoords: number[];
  private pruneTimer: any;

  onCreate(options: any) {
    console.log("Room created with options:", options);

    // Store the physical room this Colyseus room represents
    this.physicalRoomId = options.physicalRoomId || "4_4_4";
    this.roomCoords = options.roomCoords || [4, 4, 4];

    // Set room metadata for debugging/monitoring (monitor shows metadata)
    this.setMetadata({
      physicalRoomId: this.physicalRoomId,
      roomCoords: this.roomCoords,
      label: `room-${this.roomCoords[0]}-${this.roomCoords[1]}-${this.roomCoords[2]}`,
    });

    console.log(`Created Colyseus room for physical room: ${this.physicalRoomId}`, this.roomCoords);

    this.state = new MyRoomState();
    this.state.physicalRoomId = this.physicalRoomId;
    this.state.roomX = this.roomCoords[0];
    this.state.roomY = this.roomCoords[1];
    this.state.roomZ = this.roomCoords[2];

    // Subscribe to adjacent room counts using Colyseus Presence
    this.subscribeToNeighbors();

    // Heartbeat: Periodically publish room count to ensure neighbors have current state
    // This fixes the "missed message" issue for neighbors that start up later
    this.clock.setInterval(() => {
      this.updateRoomCount();
    }, 1000);

    // Periodically prune any orphan players not present in connected clients
    this.pruneTimer = setInterval(() => {
      const liveSessionIds = new Set(this.clients.map(c => c.sessionId));
      const toDelete: string[] = [];
      this.state.players.forEach((p: Player, sessId: string) => {
        if (!liveSessionIds.has(sessId)) {
          toDelete.push(sessId);
        }
      });
      toDelete.forEach((sessId) => this.state.players.delete(sessId));
    }, 2000);

    this.onMessage("playerUpdate", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        // Update position
        player.x = message.position.x;
        player.y = message.position.y;
        player.z = message.position.z;

        // Update rotation (quaternion)
        player.qx = message.quaternion.x;
        player.qy = message.quaternion.y;
        player.qz = message.quaternion.z;
        player.qw = message.quaternion.w;

        // Update gravity if changed
        if (message.gravity) {
          player.gravityX = message.gravity[0];
          player.gravityY = message.gravity[1];
          player.gravityZ = message.gravity[2];
        }

        // Update floor surface if changed
        if (message.floorSurface) {
          player.floorSurface = message.floorSurface;
        }

        // Update animation if changed
        if (message.animation) {
          player.currentAnimation = message.animation;
        }

        // Update room coordinates if changed
        if (message.roomCoords) {
          player.roomX = message.roomCoords[0];
          player.roomY = message.roomCoords[1];
          player.roomZ = message.roomCoords[2];

          // Optional: Validate that player is still in the correct room
          // If they've moved to a different physical room, they should disconnect
          // and join the appropriate Colyseus room
          const expectedRoomCoords = this.roomCoords;
          if (
            message.roomCoords[0] !== expectedRoomCoords[0] ||
            message.roomCoords[1] !== expectedRoomCoords[1] ||
            message.roomCoords[2] !== expectedRoomCoords[2]
          ) {
            console.log(`Player ${client.sessionId} has moved to different room:`,
              message.roomCoords, 'but is in room for:', expectedRoomCoords);
            // Server-authoritative: remove from this room immediately and instruct client to reconnect
            try {
              client.send("roomTransitionRequired", {
                targetRoomCoords: message.roomCoords,
              });
            } catch {}

            // Remove player from state right away to avoid lingering ghost in this room
            this.state.players.delete(client.sessionId);

            // Disconnect so client can join the target room
            client.leave(4000, "Room transition required");
          }
        }
      }
    });

    // Optional: Add room-specific messages or logic
    this.onMessage("roomSpecificAction", (client, message) => {
      // Handle actions that are specific to this physical room
      console.log(`Room-specific action in ${this.physicalRoomId}:`, message);

      // Broadcast to other players in this room
      this.broadcast("roomEvent", {
        type: message.type,
        data: message.data,
        fromPlayer: client.sessionId
      }, { except: client });
    });
  }

  // Helper to get neighbor room IDs
  getNeighborIds() {
    const [x, y, z] = this.roomCoords;
    return [
      `room-${x+1}-${y}-${z}`, `room-${x-1}-${y}-${z}`,
      `room-${x}-${y+1}-${z}`, `room-${x}-${y-1}-${z}`,
      `room-${x}-${y}-${z+1}`, `room-${x}-${y}-${z-1}`
    ];
  }

  async subscribeToNeighbors() {
    const neighbors = this.getNeighborIds();
    
    for (const neighborId of neighbors) {
      // Subscribe to count updates from this neighbor
      // Format: "room-count:room-x-y-z"
      this.presence.subscribe(`room-count:${neighborId}`, (count: string) => {
        // Notify all clients in this room about the neighbor's new count
        this.broadcast("neighborCountUpdate", {
          roomId: neighborId,
          count: parseInt(count)
        });
      });
    }
  }

  updateRoomCount() {
    // Publish this room's new count to the shared presence channel
    this.presence.publish(`room-count:${this.physicalRoomId}`, this.clients.length.toString());
    
    // Also notify clients inside this room (so they know their own room count)
    this.broadcast("roomInfo", {
      physicalRoomId: this.physicalRoomId,
      roomCoords: this.roomCoords,
      playerCount: this.clients.length
    });
  }

  onJoin(client: Client, options: any) {
    console.log(`${client.sessionId} joined physical room: ${this.physicalRoomId}`);

    // Create new player
    const player = new Player();
    player.sessionId = client.sessionId;
    player.playerId = (options && options.playerId) ? String(options.playerId) : client.sessionId;

    // De-duplicate: if a player with same playerId exists, remove or disconnect previous session
    let previousSessionId: string | null = null;
    this.state.players.forEach((p: Player, sessId: string) => {
      if (p && p.playerId === player.playerId) {
        previousSessionId = sessId;
      }
    });
    if (previousSessionId && previousSessionId !== client.sessionId) {
      try {
        // Inform previous client and disconnect
        const prevClient = this.clients.find(c => c.sessionId === previousSessionId);
        if (prevClient) {
          try { prevClient.send("duplicateSession"); } catch {}
          prevClient.leave(4001, "Duplicate playerId session");
        }
      } catch {}
      // Ensure removal from state
      this.state.players.delete(previousSessionId);
    }

    // Set initial position based on this room's coordinates
    // You might want to have spawn points for each room
    const spawnPosition = this.getSpawnPosition();
    player.x = spawnPosition.x;
    player.y = spawnPosition.y;
    player.z = spawnPosition.z;

    // Set initial room coordinates to match this Colyseus room
    player.roomX = this.roomCoords[0];
    player.roomY = this.roomCoords[1];
    player.roomZ = this.roomCoords[2];

    // Add player to state
    this.state.players.set(client.sessionId, player);

    // UPDATE COUNT
    this.updateRoomCount();
  }

  onLeave(client: Client, consented: boolean) {
    console.log(`${client.sessionId} left physical room: ${this.physicalRoomId}`);

    // Remove player from state
    this.state.players.delete(client.sessionId);

    // Safety: prune any orphan entries whose sessions aren't connected anymore
    const liveSessionIds = new Set(this.clients.map(c => c.sessionId));
    const toDelete: string[] = [];
    this.state.players.forEach((p: Player, sessId: string) => {
      if (!liveSessionIds.has(sessId)) {
        toDelete.push(sessId);
      }
    });
    toDelete.forEach((sessId) => this.state.players.delete(sessId));

    // UPDATE COUNT
    this.updateRoomCount();

    // Optional: Clean up room if empty for too long
    if (this.state.players.size === 0) {
      console.log(`Room ${this.physicalRoomId} is now empty`);
      // You could implement auto-disposal after a delay
      // setTimeout(() => {
      //   if (this.state.players.size === 0) {
      //     this.disconnect();
      //   }
      // }, 300000); // 5 minutes
    }
  }

  onDispose() {
    console.log(`Physical room ${this.physicalRoomId} disposing...`);
    if (this.pruneTimer) {
      clearInterval(this.pruneTimer);
      this.pruneTimer = undefined;
    }
    // Clear presence subscription? (Automatic in Colyseus usually)
  }

  // Helper method to get spawn position for this room
  private getSpawnPosition() {
    // You can customize spawn positions based on room coordinates
    // For now, use a default offset
    return {
      x: 2, // Offset from center to avoid central hole
      y: 5, // Above ground
      z: 2  // Offset from center
    };
  }

  // Optional: Method to get room statistics
  getStats() {
    return {
      physicalRoomId: this.physicalRoomId,
      roomCoords: this.roomCoords,
      playerCount: this.state.players.size,
      players: Array.from(this.state.players.keys())
    };
  }
}

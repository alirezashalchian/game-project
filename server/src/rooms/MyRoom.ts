import { Room, Client } from "@colyseus/core";
import { MyRoomState, Player } from "./schema/MyRoomState";

export class MyRoom extends Room<MyRoomState> {
  maxClients = 8; // Increased since rooms are smaller now
  physicalRoomId: string;
  roomCoords: number[];

  onCreate(options: any) {
    console.log("Room created with options:", options);

    // Store the physical room this Colyseus room represents
    this.physicalRoomId = options.physicalRoomId || "4_4_4";
    this.roomCoords = options.roomCoords || [4, 4, 4];

    // Set room metadata for debugging/monitoring
    this.setMetadata({
      physicalRoomId: this.physicalRoomId,
      roomCoords: this.roomCoords,
    });

    console.log(`Created Colyseus room for physical room: ${this.physicalRoomId}`, this.roomCoords);

    this.state = new MyRoomState();
    this.state.physicalRoomId = this.physicalRoomId;

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
            // Optionally disconnect the player so they rejoin the correct room
            // client.leave(1000, "Room transition required");
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

  onJoin(client: Client, options: any) {
    console.log(`${client.sessionId} joined physical room: ${this.physicalRoomId}`);

    // Create new player
    const player = new Player();
    player.sessionId = client.sessionId;

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

    // Optional: Send room-specific data to the joining player
    client.send("roomInfo", {
      physicalRoomId: this.physicalRoomId,
      roomCoords: this.roomCoords,
      playerCount: this.state.players.size
    });
  }

  onLeave(client: Client, consented: boolean) {
    console.log(`${client.sessionId} left physical room: ${this.physicalRoomId}`);

    // Remove player from state
    this.state.players.delete(client.sessionId);

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
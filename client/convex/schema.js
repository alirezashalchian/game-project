import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Table for storing room data with placed blocks
  rooms: defineTable({
    // Room identification
    roomId: v.string(), // "room-4-4-4" format
    roomCoords: v.object({
      x: v.number(),
      y: v.number(),
      z: v.number(),
    }),
    
    // Room ownership and metadata
    ownerId: v.union(v.string(), v.null()), // Player who owns this room (can be null)
    createdAt: v.number(), // Timestamp
    lastModified: v.number(), // Timestamp of last block change
    
    // Placed blocks data
    placedBlocks: v.array(
      v.object({
        id: v.string(), // Unique block ID
        modelId: v.string(), // Reference to model catalog (e.g., "bricks_A")
        position: v.object({
          x: v.number(),
          y: v.number(),
          z: v.number(),
        }),
        rotation: v.object({
          x: v.number(),
          y: v.number(),
          z: v.number(),
        }),
        scale: v.number(),
        gridDimensions: v.object({
          width: v.number(),
          height: v.number(),
          depth: v.number(),
        }),
        placedAt: v.number(), // Timestamp when block was placed
      })
    ),
    
    // Room statistics
    blockCount: v.number(),
    version: v.string(), // For future schema migrations
  })
  .index("by_room_id", ["roomId"])
  .index("by_owner", ["ownerId"])
  .index("by_coords", ["roomCoords.x", "roomCoords.y", "roomCoords.z"]),

  // Optional: Table for tracking player ownership and permissions
  players: defineTable({
    sessionId: v.string(), // Colyseus session ID
    playerId: v.string(), // Unique player identifier
    username: v.optional(v.string()),
    ownedRooms: v.array(v.string()), // Array of room IDs this player owns
    lastSeen: v.number(), // Timestamp
    createdAt: v.number(),
  })
  .index("by_session", ["sessionId"])
  .index("by_player", ["playerId"]),
});

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query to get room data with all placed blocks
export const getRoomData = query({
  args: { roomId: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_room_id", (q) => q.eq("roomId", args.roomId))
      .first();
    
    return room;
  },
});

// Query to get multiple rooms (for loading adjacent rooms)
export const getRoomsData = query({
  args: { roomIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    const rooms = await Promise.all(
      args.roomIds.map(async (roomId) => {
        return await ctx.db
          .query("rooms")
          .withIndex("by_room_id", (q) => q.eq("roomId", roomId))
          .first();
      })
    );
    
    return rooms.filter(Boolean); // Remove null results
  },
});

// Mutation to save/update room data
export const saveRoomData = mutation({
  args: {
    roomId: v.string(),
    roomCoords: v.object({
      x: v.number(),
      y: v.number(),
      z: v.number(),
    }),
    placedBlocks: v.array(
      v.object({
        id: v.string(),
        modelId: v.string(),
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
        placedAt: v.number(),
      })
    ),
    ownerId: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    // Check if room already exists
    const existingRoom = await ctx.db
      .query("rooms")
      .withIndex("by_room_id", (q) => q.eq("roomId", args.roomId))
      .first();

    const now = Date.now();

    if (existingRoom) {
      // Update existing room
      await ctx.db.patch(existingRoom._id, {
        placedBlocks: args.placedBlocks,
        blockCount: args.placedBlocks.length,
        lastModified: now,
        ...(args.ownerId && { ownerId: args.ownerId }),
      });
      return existingRoom._id;
    } else {
      // Create new room
      const roomId = await ctx.db.insert("rooms", {
        roomId: args.roomId,
        roomCoords: args.roomCoords,
        placedBlocks: args.placedBlocks,
        blockCount: args.placedBlocks.length,
        ownerId: args.ownerId || null,
        createdAt: now,
        lastModified: now,
        version: "1.0",
      });
      return roomId;
    }
  },
});

// Mutation to add a single block to a room
export const addBlockToRoom = mutation({
  args: {
    roomId: v.string(),
    block: v.object({
      id: v.string(),
      modelId: v.string(),
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
      placedAt: v.number(),
    }),
    roomCoords: v.object({
      x: v.number(),
      y: v.number(),
      z: v.number(),
    }),
    ownerId: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const existingRoom = await ctx.db
      .query("rooms")
      .withIndex("by_room_id", (q) => q.eq("roomId", args.roomId))
      .first();

    const now = Date.now();

    if (existingRoom) {
      // Add block to existing room
      const updatedBlocks = [...existingRoom.placedBlocks, args.block];
      await ctx.db.patch(existingRoom._id, {
        placedBlocks: updatedBlocks,
        blockCount: updatedBlocks.length,
        lastModified: now,
      });
    } else {
      // Create room with first block
      await ctx.db.insert("rooms", {
        roomId: args.roomId,
        roomCoords: args.roomCoords,
        placedBlocks: [args.block],
        blockCount: 1,
        ownerId: args.ownerId || null,
        createdAt: now,
        lastModified: now,
        version: "1.0",
      });
    }
  },
});

// Mutation to remove a block from a room
export const removeBlockFromRoom = mutation({
  args: {
    roomId: v.string(),
    blockId: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_room_id", (q) => q.eq("roomId", args.roomId))
      .first();

    if (!room) return;

    const updatedBlocks = room.placedBlocks.filter(
      (block) => block.id !== args.blockId
    );

    await ctx.db.patch(room._id, {
      placedBlocks: updatedBlocks,
      blockCount: updatedBlocks.length,
      lastModified: Date.now(),
    });
  },
});

// Mutation to update a block in a room
export const updateBlockInRoom = mutation({
  args: {
    roomId: v.string(),
    blockId: v.string(),
    updates: v.object({
      position: v.optional(v.object({
        x: v.number(),
        y: v.number(),
        z: v.number(),
      })),
      rotation: v.optional(v.object({
        x: v.number(),
        y: v.number(),
        z: v.number(),
      })),
    }),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_room_id", (q) => q.eq("roomId", args.roomId))
      .first();

    if (!room) return;

    const updatedBlocks = room.placedBlocks.map((block) => {
      if (block.id === args.blockId) {
        return {
          ...block,
          ...args.updates,
        };
      }
      return block;
    });

    await ctx.db.patch(room._id, {
      placedBlocks: updatedBlocks,
      lastModified: Date.now(),
    });
  },
});

// Query to get rooms owned by a player
export const getPlayerRooms = query({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => {
    const rooms = await ctx.db
      .query("rooms")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect();
    
    return rooms;
  },
});

// Mutation to clear all blocks from a room
export const clearRoom = mutation({
  args: { roomId: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_room_id", (q) => q.eq("roomId", args.roomId))
      .first();

    if (!room) return;

    await ctx.db.patch(room._id, {
      placedBlocks: [],
      blockCount: 0,
      lastModified: Date.now(),
    });
  },
});

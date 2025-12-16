import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Mock characters data - will be replaced with NFT fetching later
const MOCK_CHARACTERS = [
  {
    id: "char_mage_1",
    name: "Arcane Wanderer",
    type: "Mage",
    imageUrl: "/models/characters/mage.png",
  },
  {
    id: "char_barbarian_1",
    name: "Storm Breaker",
    type: "Barbarian",
    imageUrl: "/models/characters/barbarian.png",
  },
  {
    id: "char_knight_1",
    name: "Iron Guardian",
    type: "Knight",
    imageUrl: "/models/characters/knight.png",
  },
  {
    id: "char_rogue_1",
    name: "Shadow Dancer",
    type: "Rogue",
    imageUrl: "/models/characters/rogue.png",
  },
];

// Query to get player by wallet address
export const getPlayerByWallet = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const normalizedAddress = args.walletAddress.toLowerCase();
    const player = await ctx.db
      .query("players")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", normalizedAddress))
      .first();

    return player;
  },
});

// Get or create player - returns existing player or creates new one with mock characters
export const getOrCreatePlayer = mutation({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const normalizedAddress = args.walletAddress.toLowerCase();

    // Check if player exists
    const existingPlayer = await ctx.db
      .query("players")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", normalizedAddress))
      .first();

    if (existingPlayer) {
      // Update last seen
      await ctx.db.patch(existingPlayer._id, {
        lastSeen: Date.now(),
      });
      return existingPlayer;
    }

    // Create new player with mock characters
    const now = Date.now();
    const playerId = await ctx.db.insert("players", {
      walletAddress: normalizedAddress,
      characters: MOCK_CHARACTERS,
      selectedCharacterId: MOCK_CHARACTERS[0].id, // Default to first character
      lastSeen: now,
      createdAt: now,
    });

    // Return the created player
    const newPlayer = await ctx.db.get(playerId);
    return newPlayer;
  },
});

// Update selected character
export const updateSelectedCharacter = mutation({
  args: {
    walletAddress: v.string(),
    characterId: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedAddress = args.walletAddress.toLowerCase();

    const player = await ctx.db
      .query("players")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", normalizedAddress))
      .first();

    if (!player) {
      throw new Error("Player not found");
    }

    // Verify the character belongs to the player
    const hasCharacter = player.characters.some(
      (c) => c.id === args.characterId
    );
    if (!hasCharacter) {
      throw new Error("Character not found in player's collection");
    }

    await ctx.db.patch(player._id, {
      selectedCharacterId: args.characterId,
      lastSeen: Date.now(),
    });

    return { success: true };
  },
});

// Update player username
export const updateUsername = mutation({
  args: {
    walletAddress: v.string(),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedAddress = args.walletAddress.toLowerCase();

    const player = await ctx.db
      .query("players")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", normalizedAddress))
      .first();

    if (!player) {
      throw new Error("Player not found");
    }

    await ctx.db.patch(player._id, {
      username: args.username,
      lastSeen: Date.now(),
    });

    return { success: true };
  },
});

// Claim a room as the player's home
export const claimRoom = mutation({
  args: {
    walletAddress: v.string(),
    roomId: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedAddress = args.walletAddress.toLowerCase();

    const player = await ctx.db
      .query("players")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", normalizedAddress))
      .first();

    if (!player) {
      throw new Error("Player not found");
    }

    // Check if room is already claimed by someone else
    const existingOwner = await ctx.db
      .query("players")
      .filter((q) => q.eq(q.field("ownedRoomId"), args.roomId))
      .first();

    if (existingOwner && existingOwner._id !== player._id) {
      throw new Error("Room is already claimed by another player");
    }

    await ctx.db.patch(player._id, {
      ownedRoomId: args.roomId,
      lastSeen: Date.now(),
    });

    return { success: true };
  },
});

// Get player's selected character details
export const getSelectedCharacter = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const normalizedAddress = args.walletAddress.toLowerCase();

    const player = await ctx.db
      .query("players")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", normalizedAddress))
      .first();

    if (!player || !player.selectedCharacterId) {
      return null;
    }

    return player.characters.find((c) => c.id === player.selectedCharacterId);
  },
});


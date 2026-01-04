import { defineChain } from "viem";

/**
 * LUKSO Mainnet chain definition for viem
 */
export const luksoMainnet = defineChain({
  id: 42,
  name: "LUKSO",
  nativeCurrency: {
    decimals: 18,
    name: "LYX",
    symbol: "LYX",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.mainnet.lukso.network"],
      webSocket: ["wss://ws-rpc.mainnet.lukso.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "LUKSO Explorer",
      url: "https://explorer.execution.mainnet.lukso.network",
    },
  },
});

/**
 * LUKSO Testnet chain definition for viem
 */
export const luksoTestnet = defineChain({
  id: 4201,
  name: "LUKSO Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "LYXt",
    symbol: "LYXt",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.lukso.network"],
      webSocket: ["wss://ws-rpc.testnet.lukso.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "LUKSO Testnet Explorer",
      url: "https://explorer.execution.testnet.lukso.network",
    },
  },
  testnet: true,
});

/**
 * Deployed contract addresses on LUKSO Mainnet
 */
export const CONTRACTS = {
  characterNFT: "0xb62d99f1db20f68374f5ccc70bf705b733c77b33" as const,
  blockTypeRegistry: "0x02736d0c96b64f35924ac5493c989b932244ca75" as const,
} as const;

/**
 * Character types available in the game
 */
export enum CharacterType {
  Mage = 0,
  Barbarian = 1,
  Knight = 2,
  Rogue = 3,
}

/**
 * Grid dimensions for the 9x9x9 room world
 */
export const GRID_SIZE = 9;
export const TOTAL_ROOMS = GRID_SIZE * GRID_SIZE * GRID_SIZE; // 729

/**
 * Type definitions for contract return values
 */
export interface RoomCoords {
  x: number;
  y: number;
  z: number;
}

export interface CharacterData {
  characterType: CharacterType;
  name: string;
  imageUrl: string;
  room: RoomCoords;
  mintedAt: bigint;
}

export interface BlockTypeInfo {
  name: string;
  symbol: string;
  isPremium: boolean;
  pricePerUnit: bigint;
  modelPath: string;
  tokenContract: `0x${string}`;
}



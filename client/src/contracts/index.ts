/**
 * Contract Exports
 * 
 * Re-exports all contract-related types, ABIs, and configuration
 * for convenient importing throughout the application.
 */

// Chain configuration and contract addresses
export {
  luksoMainnet,
  luksoTestnet,
  CONTRACTS,
  CharacterType,
  GRID_SIZE,
  TOTAL_ROOMS,
  type RoomCoords,
  type CharacterData,
  type BlockTypeInfo,
} from "./config";

// Contract ABIs
export {
  characterNFTAbi,
  blockTokenAbi,
  blockTypeRegistryAbi,
  photoFrameBlockAbi,
} from "./abis";



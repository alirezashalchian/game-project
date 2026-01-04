import { useState, useCallback } from "react";
import { type Hash, type Address } from "viem";
import { useContracts } from "../context/ContractsContext";
import { characterNFTAbi } from "../contracts/abis";
import {
  CONTRACTS,
  CharacterType,
  type RoomCoords,
} from "../contracts/config";

/**
 * Character NFT data as returned from the contract
 */
interface CharacterInfo {
  tokenId: `0x${string}`;
  characterType: CharacterType;
  name: string;
  imageUrl: string;
  roomX: number;
  roomY: number;
  roomZ: number;
  mintedAt: bigint;
}

/**
 * Hook return type
 */
interface UseCharacterNFTReturn {
  // Read functions
  getMintPrice: () => Promise<bigint>;
  isRoomAvailable: (x: number, y: number, z: number) => Promise<boolean>;
  getAvailableRooms: () => Promise<RoomCoords[]>;
  getCharacter: (tokenId: `0x${string}`) => Promise<CharacterInfo>;
  getCharacterInRoom: (x: number, y: number, z: number) => Promise<`0x${string}`>;
  getPlayerCharacters: (address: Address) => Promise<`0x${string}`[]>;
  getTotalMinted: () => Promise<bigint>;

  // Write functions
  mintCharacter: (params: {
    characterType: CharacterType;
    name: string;
    imageUrl: string;
    roomX: number;
    roomY: number;
    roomZ: number;
  }) => Promise<Hash>;

  // State
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for interacting with the CharacterNFT contract
 * Provides type-safe access to minting characters, checking rooms, and querying character data.
 */
export function useCharacterNFT(): UseCharacterNFTReturn {
  const { publicClient, walletClient, address } = useContracts();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const contractAddress = CONTRACTS.characterNFT as Address;

  /**
   * Get the current mint price in wei
   */
  const getMintPrice = useCallback(async (): Promise<bigint> => {
    const result = await publicClient.readContract({
      address: contractAddress,
      abi: characterNFTAbi,
      functionName: "mintPrice",
    });
    return result as bigint;
  }, [publicClient, contractAddress]);

  /**
   * Check if a room is available for selection
   */
  const isRoomAvailable = useCallback(
    async (x: number, y: number, z: number): Promise<boolean> => {
      const result = await publicClient.readContract({
        address: contractAddress,
        abi: characterNFTAbi,
        functionName: "isRoomAvailable",
        args: [x, y, z],
      });
      return result as boolean;
    },
    [publicClient, contractAddress]
  );

  /**
   * Get all available rooms in the grid
   */
  const getAvailableRooms = useCallback(async (): Promise<RoomCoords[]> => {
    const result = await publicClient.readContract({
      address: contractAddress,
      abi: characterNFTAbi,
      functionName: "getAvailableRooms",
    });
    return (result as readonly { x: number; y: number; z: number }[]).map(
      (room) => ({
        x: room.x,
        y: room.y,
        z: room.z,
      })
    );
  }, [publicClient, contractAddress]);

  /**
   * Get character data by token ID
   */
  const getCharacter = useCallback(
    async (tokenId: `0x${string}`): Promise<CharacterInfo> => {
      const result = await publicClient.readContract({
        address: contractAddress,
        abi: characterNFTAbi,
        functionName: "getCharacter",
        args: [tokenId],
      });

      const [characterType, name, imageUrl, roomX, roomY, roomZ, mintedAt] =
        result as [number, string, string, number, number, number, bigint];

      return {
        tokenId,
        characterType: characterType as CharacterType,
        name,
        imageUrl,
        roomX,
        roomY,
        roomZ,
        mintedAt,
      };
    },
    [publicClient, contractAddress]
  );

  /**
   * Get the character that owns a specific room
   */
  const getCharacterInRoom = useCallback(
    async (x: number, y: number, z: number): Promise<`0x${string}`> => {
      const result = await publicClient.readContract({
        address: contractAddress,
        abi: characterNFTAbi,
        functionName: "getCharacterInRoom",
        args: [x, y, z],
      });
      return result as `0x${string}`;
    },
    [publicClient, contractAddress]
  );

  /**
   * Get all character token IDs owned by a player
   */
  const getPlayerCharacters = useCallback(
    async (playerAddress: Address): Promise<`0x${string}`[]> => {
      const result = await publicClient.readContract({
        address: contractAddress,
        abi: characterNFTAbi,
        functionName: "tokenIdsOf",
        args: [playerAddress],
      });
      return result as `0x${string}`[];
    },
    [publicClient, contractAddress]
  );

  /**
   * Get total number of characters minted
   */
  const getTotalMinted = useCallback(async (): Promise<bigint> => {
    const result = await publicClient.readContract({
      address: contractAddress,
      abi: characterNFTAbi,
      functionName: "totalMinted",
    });
    return result as bigint;
  }, [publicClient, contractAddress]);

  /**
   * Mint a new character NFT with room selection
   */
  const mintCharacter = useCallback(
    async (params: {
      characterType: CharacterType;
      name: string;
      imageUrl: string;
      roomX: number;
      roomY: number;
      roomZ: number;
    }): Promise<Hash> => {
      if (!walletClient || !address) {
        throw new Error("Wallet not connected");
      }

      setIsLoading(true);
      setError(null);

      try {
        // Get current mint price
        const mintPrice = await getMintPrice();

        // Prepare and send the transaction
        const hash = await walletClient.writeContract({
          address: contractAddress,
          abi: characterNFTAbi,
          functionName: "mint",
          args: [
            params.characterType,
            params.name,
            params.imageUrl,
            params.roomX,
            params.roomY,
            params.roomZ,
          ],
          value: mintPrice,
          account: address,
        });

        // Wait for transaction confirmation
        await publicClient.waitForTransactionReceipt({ hash });

        return hash;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [walletClient, address, publicClient, contractAddress, getMintPrice]
  );

  return {
    // Read functions
    getMintPrice,
    isRoomAvailable,
    getAvailableRooms,
    getCharacter,
    getCharacterInRoom,
    getPlayerCharacters,
    getTotalMinted,

    // Write functions
    mintCharacter,

    // State
    isLoading,
    error,
  };
}


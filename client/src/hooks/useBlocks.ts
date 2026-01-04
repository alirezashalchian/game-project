import { useState, useCallback } from "react";
import { type Hash, type Address } from "viem";
import { useContracts } from "../context/ContractsContext";
import {
  blockTypeRegistryAbi,
  blockTokenAbi,
  photoFrameBlockAbi,
} from "../contracts/abis";
import { CONTRACTS, type BlockTypeInfo } from "../contracts/config";

/**
 * Block type with calculated ID
 */
interface BlockType extends BlockTypeInfo {
  id: `0x${string}`;
}

/**
 * Player's block inventory item
 */
interface BlockInventoryItem {
  blockTypeId: `0x${string}`;
  name: string;
  balance: bigint;
  isPremium: boolean;
  pricePerUnit: bigint;
  modelPath: string;
  tokenContract: Address;
}

/**
 * Frame metadata
 */
interface FrameMetadata {
  imageUrl: string;
  linkUrl: string;
  description: string;
  isSet: boolean;
}

/**
 * Hook return type
 */
interface UseBlocksReturn {
  // Registry read functions
  getAllBlockTypes: () => Promise<BlockType[]>;
  getBlockTypeInfo: (blockTypeId: `0x${string}`) => Promise<BlockTypeInfo>;
  getBlockContract: (blockTypeId: `0x${string}`) => Promise<Address>;

  // Block token read functions
  getBlockBalance: (
    blockTokenAddress: Address,
    playerAddress: Address
  ) => Promise<bigint>;
  getBlockInfo: (
    blockTokenAddress: Address
  ) => Promise<{ name: string; premium: boolean; price: bigint; path: string }>;

  // Player inventory
  getPlayerInventory: (playerAddress: Address) => Promise<BlockInventoryItem[]>;

  // Block token write functions
  purchaseBlocks: (
    blockTokenAddress: Address,
    amount: bigint
  ) => Promise<Hash>;
  placeBlocks: (blockTokenAddress: Address, amount: bigint) => Promise<Hash>;

  // Photo frame functions
  getFrameMetadata: (
    frameContract: Address,
    owner: Address,
    frameIndex: bigint
  ) => Promise<FrameMetadata>;
  setFrameMetadata: (
    frameContract: Address,
    frameIndex: bigint,
    imageUrl: string,
    linkUrl: string,
    description: string
  ) => Promise<Hash>;
  purchaseFrames: (frameContract: Address, amount: bigint) => Promise<Hash>;
  placeFrame: (frameContract: Address, frameIndex: bigint) => Promise<Hash>;

  // State
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for interacting with BlockTypeRegistry, BlockToken, and PhotoFrameBlock contracts.
 * Provides type-safe access to block types, purchases, placement, and inventory.
 */
export function useBlocks(): UseBlocksReturn {
  const { publicClient, walletClient, address } = useContracts();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const registryAddress = CONTRACTS.blockTypeRegistry as Address;

  // ============================================
  // Registry Read Functions
  // ============================================

  /**
   * Get all registered block types with their info
   */
  const getAllBlockTypes = useCallback(async (): Promise<BlockType[]> => {
    // Get all block type IDs
    const blockTypeIds = (await publicClient.readContract({
      address: registryAddress,
      abi: blockTypeRegistryAbi,
      functionName: "getAllBlockTypes",
    })) as `0x${string}`[];

    // Fetch info for each block type
    const blockTypes: BlockType[] = await Promise.all(
      blockTypeIds.map(async (id) => {
        const info = (await publicClient.readContract({
          address: registryAddress,
          abi: blockTypeRegistryAbi,
          functionName: "getBlockTypeInfo",
          args: [id],
        })) as [string, string, boolean, bigint, string, Address];

        return {
          id,
          name: info[0],
          symbol: info[1],
          isPremium: info[2],
          pricePerUnit: info[3],
          modelPath: info[4],
          tokenContract: info[5],
        };
      })
    );

    return blockTypes;
  }, [publicClient, registryAddress]);

  /**
   * Get info for a specific block type
   */
  const getBlockTypeInfo = useCallback(
    async (blockTypeId: `0x${string}`): Promise<BlockTypeInfo> => {
      const result = (await publicClient.readContract({
        address: registryAddress,
        abi: blockTypeRegistryAbi,
        functionName: "getBlockTypeInfo",
        args: [blockTypeId],
      })) as [string, string, boolean, bigint, string, Address];

      return {
        name: result[0],
        symbol: result[1],
        isPremium: result[2],
        pricePerUnit: result[3],
        modelPath: result[4],
        tokenContract: result[5],
      };
    },
    [publicClient, registryAddress]
  );

  /**
   * Get the token contract address for a block type
   */
  const getBlockContract = useCallback(
    async (blockTypeId: `0x${string}`): Promise<Address> => {
      const result = await publicClient.readContract({
        address: registryAddress,
        abi: blockTypeRegistryAbi,
        functionName: "getBlockContract",
        args: [blockTypeId],
      });
      return result as Address;
    },
    [publicClient, registryAddress]
  );

  // ============================================
  // Block Token Read Functions
  // ============================================

  /**
   * Get a player's balance for a specific block type
   */
  const getBlockBalance = useCallback(
    async (blockTokenAddress: Address, playerAddress: Address): Promise<bigint> => {
      const result = await publicClient.readContract({
        address: blockTokenAddress,
        abi: blockTokenAbi,
        functionName: "balanceOf",
        args: [playerAddress],
      });
      return result as bigint;
    },
    [publicClient]
  );

  /**
   * Get block info from a BlockToken contract
   */
  const getBlockInfo = useCallback(
    async (
      blockTokenAddress: Address
    ): Promise<{ name: string; premium: boolean; price: bigint; path: string }> => {
      const result = (await publicClient.readContract({
        address: blockTokenAddress,
        abi: blockTokenAbi,
        functionName: "getBlockInfo",
      })) as [string, boolean, bigint, string];

      return {
        name: result[0],
        premium: result[1],
        price: result[2],
        path: result[3],
      };
    },
    [publicClient]
  );

  /**
   * Get a player's complete block inventory
   */
  const getPlayerInventory = useCallback(
    async (playerAddress: Address): Promise<BlockInventoryItem[]> => {
      const blockTypes = await getAllBlockTypes();

      const inventory: BlockInventoryItem[] = await Promise.all(
        blockTypes.map(async (blockType) => {
          const balance = await getBlockBalance(
            blockType.tokenContract,
            playerAddress
          );

          return {
            blockTypeId: blockType.id,
            name: blockType.name,
            balance,
            isPremium: blockType.isPremium,
            pricePerUnit: blockType.pricePerUnit,
            modelPath: blockType.modelPath,
            tokenContract: blockType.tokenContract,
          };
        })
      );

      return inventory;
    },
    [getAllBlockTypes, getBlockBalance]
  );

  // ============================================
  // Block Token Write Functions
  // ============================================

  /**
   * Purchase premium blocks with LYX
   */
  const purchaseBlocks = useCallback(
    async (blockTokenAddress: Address, amount: bigint): Promise<Hash> => {
      if (!walletClient || !address) {
        throw new Error("Wallet not connected");
      }

      setIsLoading(true);
      setError(null);

      try {
        // Get price per unit
        const pricePerUnit = (await publicClient.readContract({
          address: blockTokenAddress,
          abi: blockTokenAbi,
          functionName: "pricePerUnit",
        })) as bigint;

        const totalCost = pricePerUnit * amount;

        const hash = await walletClient.writeContract({
          address: blockTokenAddress,
          abi: blockTokenAbi,
          functionName: "purchase",
          args: [amount],
          value: totalCost,
          account: address,
        });

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
    [walletClient, address, publicClient]
  );

  /**
   * Place blocks in the game world (burns tokens)
   */
  const placeBlocks = useCallback(
    async (blockTokenAddress: Address, amount: bigint): Promise<Hash> => {
      if (!walletClient || !address) {
        throw new Error("Wallet not connected");
      }

      setIsLoading(true);
      setError(null);

      try {
        const hash = await walletClient.writeContract({
          address: blockTokenAddress,
          abi: blockTokenAbi,
          functionName: "placeBlocks",
          args: [amount],
          account: address,
        });

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
    [walletClient, address, publicClient]
  );

  // ============================================
  // Photo Frame Functions
  // ============================================

  /**
   * Get metadata for a specific photo frame
   */
  const getFrameMetadata = useCallback(
    async (
      frameContract: Address,
      owner: Address,
      frameIndex: bigint
    ): Promise<FrameMetadata> => {
      const result = (await publicClient.readContract({
        address: frameContract,
        abi: photoFrameBlockAbi,
        functionName: "getFrameMetadata",
        args: [owner, frameIndex],
      })) as [string, string, string, boolean];

      return {
        imageUrl: result[0],
        linkUrl: result[1],
        description: result[2],
        isSet: result[3],
      };
    },
    [publicClient]
  );

  /**
   * Set metadata for a photo frame
   */
  const setFrameMetadata = useCallback(
    async (
      frameContract: Address,
      frameIndex: bigint,
      imageUrl: string,
      linkUrl: string,
      description: string
    ): Promise<Hash> => {
      if (!walletClient || !address) {
        throw new Error("Wallet not connected");
      }

      setIsLoading(true);
      setError(null);

      try {
        const hash = await walletClient.writeContract({
          address: frameContract,
          abi: photoFrameBlockAbi,
          functionName: "setFrameMetadata",
          args: [frameIndex, imageUrl, linkUrl, description],
          account: address,
        });

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
    [walletClient, address, publicClient]
  );

  /**
   * Purchase photo frames with LYX
   */
  const purchaseFrames = useCallback(
    async (frameContract: Address, amount: bigint): Promise<Hash> => {
      if (!walletClient || !address) {
        throw new Error("Wallet not connected");
      }

      setIsLoading(true);
      setError(null);

      try {
        // Get price per unit
        const pricePerUnit = (await publicClient.readContract({
          address: frameContract,
          abi: photoFrameBlockAbi,
          functionName: "pricePerUnit",
        })) as bigint;

        const totalCost = pricePerUnit * amount;

        const hash = await walletClient.writeContract({
          address: frameContract,
          abi: photoFrameBlockAbi,
          functionName: "purchase",
          args: [amount],
          value: totalCost,
          account: address,
        });

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
    [walletClient, address, publicClient]
  );

  /**
   * Place a photo frame in the game world (burns token)
   */
  const placeFrame = useCallback(
    async (frameContract: Address, frameIndex: bigint): Promise<Hash> => {
      if (!walletClient || !address) {
        throw new Error("Wallet not connected");
      }

      setIsLoading(true);
      setError(null);

      try {
        const hash = await walletClient.writeContract({
          address: frameContract,
          abi: photoFrameBlockAbi,
          functionName: "placeFrame",
          args: [frameIndex],
          account: address,
        });

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
    [walletClient, address, publicClient]
  );

  return {
    // Registry read functions
    getAllBlockTypes,
    getBlockTypeInfo,
    getBlockContract,

    // Block token read functions
    getBlockBalance,
    getBlockInfo,

    // Player inventory
    getPlayerInventory,

    // Block token write functions
    purchaseBlocks,
    placeBlocks,

    // Photo frame functions
    getFrameMetadata,
    setFrameMetadata,
    purchaseFrames,
    placeFrame,

    // State
    isLoading,
    error,
  };
}


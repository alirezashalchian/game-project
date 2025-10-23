import { useQuery, useMutation } from "convex/react";
import { useCallback } from "react";
import { api } from "../../convex/_generated/api";
import { getCoordsFromRoomId } from "../utils/roomUtils";

export function useRoomData(roomId) {
  // Query room data
  const roomData = useQuery(api.rooms.getRoomData, roomId ? { roomId } : "skip");
  
  // Mutations
  const saveRoom = useMutation(api.rooms.saveRoomData);
  const addBlock = useMutation(api.rooms.addBlockToRoom);
  const removeBlock = useMutation(api.rooms.removeBlockFromRoom);
  const updateBlock = useMutation(api.rooms.updateBlockInRoom);
  const clearRoom = useMutation(api.rooms.clearRoom);

  // Helper function to convert your current model format to Convex format
  const convertModelToConvexFormat = useCallback((model) => {
    
    const convexModel = {
      id: model.id,
      modelId: model.modelId,
      position: {
        x: model.position[0],
        y: model.position[1],
        z: model.position[2],
      },
      rotation: {
        x: model.rotation[0],
        y: model.rotation[1],
        z: model.rotation[2],
      },
      scale: model.scale,
      gridDimensions: model.gridDimensions,
      placedAt: Date.now(),
    };
    
    
    return convexModel;
  }, []);

  // Helper function to convert Convex format back to your model format
  const convertConvexToModelFormat = useCallback((convexBlock, roomId) => {
    
    const gameModel = {
      id: convexBlock.id,
      modelId: convexBlock.modelId,
      position: [convexBlock.position.x, convexBlock.position.y, convexBlock.position.z],
      rotation: [convexBlock.rotation.x, convexBlock.rotation.y, convexBlock.rotation.z],
      scale: convexBlock.scale,
      gridDimensions: convexBlock.gridDimensions,
      roomId: roomId,
      placedAt: convexBlock.placedAt,
    };
    
    
    return gameModel;
  }, []);

  // Save entire room
  const saveRoomToConvex = useCallback(async (placedModels, ownerId) => {
    if (!roomId) return;

    try {
      const roomCoords = getCoordsFromRoomId(roomId);
      const convexBlocks = placedModels.map(convertModelToConvexFormat);
      
      await saveRoom({
        roomId,
        roomCoords: {
          x: roomCoords[0],
          y: roomCoords[1],
          z: roomCoords[2],
        },
        placedBlocks: convexBlocks,
        ownerId,
      });
    } catch (error) {
      console.error("Failed to save room to Convex:", error);
      throw error;
    }
  }, [roomId, saveRoom, convertModelToConvexFormat]);

  // Add single block
  const addBlockToConvex = useCallback(async (model, ownerId) => {
    if (!roomId) return;

    try {
      const roomCoords = getCoordsFromRoomId(roomId);
      const convexBlock = convertModelToConvexFormat(model);
      
      await addBlock({
        roomId,
        block: convexBlock,
        roomCoords: {
          x: roomCoords[0],
          y: roomCoords[1],
          z: roomCoords[2],
        },
        ownerId,
      });
    } catch (error) {
      console.error("Failed to add block to Convex:", error);
      throw error;
    }
  }, [roomId, addBlock, convertModelToConvexFormat]);

  // Remove single block
  const removeBlockFromConvex = useCallback(async (blockId) => {
    if (!roomId) return;
    
    try {
      await removeBlock({
        roomId,
        blockId,
      });
    } catch (error) {
      console.error("Failed to remove block from Convex:", error);
      throw error;
    }
  }, [roomId, removeBlock]);

  // Update block position/rotation
  const updateBlockInConvex = useCallback(async (blockId, updates) => {
    if (!roomId) return;
    
    try {
      const convexUpdates = {};
      if (updates.position) {
        convexUpdates.position = {
          x: updates.position[0],
          y: updates.position[1],
          z: updates.position[2],
        };
      }
      if (updates.rotation) {
        convexUpdates.rotation = {
          x: updates.rotation[0],
          y: updates.rotation[1],
          z: updates.rotation[2],
        };
      }
      
      await updateBlock({
        roomId,
        blockId,
        updates: convexUpdates,
      });
    } catch (error) {
      console.error("Failed to update block in Convex:", error);
      throw error;
    }
  }, [roomId, updateBlock]);

  // Clear all blocks from room
  const clearRoomInConvex = useCallback(async () => {
    if (!roomId) return;
    
    try {
      await clearRoom({ roomId });
    } catch (error) {
      console.error("Failed to clear room in Convex:", error);
      throw error;
    }
  }, [roomId, clearRoom]);

  return {
    roomData,
    isLoading: roomData === undefined,
    saveRoomToConvex,
    addBlockToConvex,
    removeBlockFromConvex,
    updateBlockInConvex,
    clearRoomInConvex,
    convertConvexToModelFormat,
  };
}
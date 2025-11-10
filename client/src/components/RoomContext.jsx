import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import {
  findRoomContainingPoint,
  positionArrayToObject,
  getCoordsFromRoomId,
} from "../utils/roomUtils";
import { useRoomData } from "../hooks/useRoomData";
import { modelCatalog } from "../models";
import { useColyseus } from "@/context/ColyseusContext";

const RoomContext = createContext(null);

export function RoomProvider({ children }) {
  // Track placed models
  const [placedModels, setPlacedModels] = useState([]);
  // Track currently selected model from catalog
  const [selectedModel, setSelectedModel] = useState(null);
  // Track placement mode
  const [isPlacementMode, setIsPlacementMode] = useState(false);
  // Track current room
  const [currentRoom, setCurrentRoom] = useState(null);
  // Track all available rooms
  const [availableRooms, setAvailableRooms] = useState([]);
  // Store room refs
  const roomRefs = useRef([]);
  // Track last position to avoid unnecessary updates
  const lastPositionRef = useRef(null);
  const { handleRoomTransition } = useColyseus();

  // Convex integration
  const {
    roomData,
    isLoading: isRoomDataLoading,
    addBlockToConvex,
    removeBlockFromConvex,
    updateBlockInConvex,
    clearRoomInConvex,
    convertConvexToModelFormat,
  } = useRoomData(currentRoom?.id);

  // Load room data from Convex when room changes
  useEffect(() => {
    if (!currentRoom) return;

    if (roomData && roomData.placedBlocks) {
      // Room exists in Convex - load the blocks
      const convertedModels = roomData.placedBlocks.map((block) => {
        const baseModel = convertConvexToModelFormat(block, currentRoom.id);

        // Add back model catalog data
        const catalogModel = modelCatalog.find((m) => m.id === block.modelId);
        if (catalogModel) {
          const finalModel = {
            ...baseModel,
            path: catalogModel.path,
            category: catalogModel.category,
            name: catalogModel.name,
            rotatable: catalogModel.rotatable,
            // ... other catalog properties
          };

          return finalModel;
        }
        return baseModel;
      });

      setPlacedModels(convertedModels);
    } else if (roomData === null || roomData === undefined) {
      setPlacedModels([]);
    }
  }, [roomData, currentRoom, convertConvexToModelFormat]);

  // Register a room
  const registerRoom = useCallback(
    (roomRef) => {
      if (roomRef && !roomRefs.current.includes(roomRef)) {
        roomRefs.current.push(roomRef);

        // If room data is available, add it to available rooms
        if (roomRef.current) {
          setAvailableRooms((prevRooms) => {
            // Check if room already exists
            const exists = prevRooms.some(
              (room) => room.id === roomRef.current.id
            );

            if (!exists) {
              // If this is the first room being registered and no current room is set,
              // automatically set it as the current room
              if (prevRooms.length === 0 && !currentRoom) {
                setCurrentRoom(roomRef.current);
              }

              return [...prevRooms, roomRef.current];
            }
            return prevRooms;
          });
        }
      }
    },
    [currentRoom]
  );

  // Effect to update available rooms when room refs change
  useEffect(() => {
    const validRooms = roomRefs.current
      .filter((ref) => ref.current)
      .map((ref) => ref.current);

    if (validRooms.length > 0) {
      setAvailableRooms(validRooms);

      // Set the first room as current room if none is set
      if (!currentRoom && validRooms.length > 0) {
        setCurrentRoom(validRooms[0]);
      }
    }
  }, [currentRoom]);

  // Notify Colyseus when the physical room changes so we can re/connect to the correct server room
  useEffect(() => {
    if (!currentRoom) return;
    const coords = getCoordsFromRoomId(currentRoom.id);
    handleRoomTransition(coords);
  }, [currentRoom, handleRoomTransition]);

  // Update current room based on character position
  const updateCurrentRoom = useCallback(
    (characterPosition) => {
      // Skip if position hasn't changed significantly
      if (lastPositionRef.current) {
        const [lastX, lastY, lastZ] = lastPositionRef.current;
        const [x, y, z] = characterPosition;
        const threshold = 0.1; // Minimum position change to process

        if (
          Math.abs(lastX - x) < threshold &&
          Math.abs(lastY - y) < threshold &&
          Math.abs(lastZ - z) < threshold
        ) {
          return;
        }
      }

      // Update last position
      lastPositionRef.current = [...characterPosition];

      const point = positionArrayToObject(characterPosition);

      // Use our pre-calculated room data for fast lookup
      const newRoom = findRoomContainingPoint(point);

      if (newRoom) {
        // Only update if room has changed
        if (!currentRoom || newRoom.id !== currentRoom.id) {
          setCurrentRoom(newRoom);
        }
      }
    },
    [currentRoom]
  );

  // Get models in the current room
  const getModelsInCurrentRoom = useCallback(() => {
    if (!currentRoom) return [];

    return placedModels.filter((model) => model.roomId === currentRoom.id);
  }, [placedModels, currentRoom]);

  // Add a new model to the room
  const addModel = useCallback(
    async (modelData, position, rotation) => {
      if (!currentRoom) return null;

      // Create a new model with all the required properties
      const newModel = {
        ...modelData,
        id: `model-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        modelId: modelData.id,
        position,
        rotation,
        roomId: currentRoom.id,
        // Ensure scale and gridDimensions are preserved
        scale: modelData.scale,
        gridDimensions: modelData.gridDimensions,
      };

      // Update local state immediately for responsiveness
      setPlacedModels((prev) => [...prev, newModel]);

      // Save to Convex asynchronously
      try {
        await addBlockToConvex(newModel, null); // Pass null as ownerId for now
      } catch (error) {
        console.error("Failed to save block to Convex:", error);
        // Optionally revert local state on error
        // setPlacedModels((prev) => prev.filter(model => model.id !== newModel.id));
      }

      return newModel.id;
    },
    [currentRoom, addBlockToConvex]
  );

  // Remove a model from the room
  const removeModel = useCallback(
    async (modelId) => {
      // Update local state immediately
      setPlacedModels((prev) => prev.filter((model) => model.id !== modelId));

      // Remove from Convex asynchronously
      try {
        await removeBlockFromConvex(modelId);
      } catch (error) {
        console.error("Failed to remove block from Convex:", error);
      }
    },
    [removeBlockFromConvex]
  );

  // Move an existing model
  const updateModelPosition = useCallback(
    async (modelId, position, rotation) => {
      // Update local state immediately
      setPlacedModels((prev) =>
        prev.map((model) =>
          model.id === modelId ? { ...model, position, rotation } : model
        )
      );

      // Update in Convex asynchronously
      try {
        await updateBlockInConvex(modelId, { position, rotation });
      } catch (error) {
        console.error("Failed to update block in Convex:", error);
      }
    },
    [updateBlockInConvex]
  );

  // Update a placed model with new properties
  const updatePlacedModel = useCallback((updatedModel) => {
    setPlacedModels((prev) =>
      prev.map((model) => (model.id === updatedModel.id ? updatedModel : model))
    );
  }, []);

  // Get current room grid coordinates
  const getCurrentRoomCoords = useCallback(() => {
    if (!currentRoom) return [4, 4, 4]; // Default to center of 9x9x9 complex
    return getCoordsFromRoomId(currentRoom.id);
  }, [currentRoom]);

  // Note: Individual block operations are automatically saved
  // No manual room saving needed

  // Clear entire room
  const clearRoom = useCallback(async () => {
    if (!currentRoom) return;

    try {
      // Clear local state immediately
      setPlacedModels([]);

      // Clear from Convex asynchronously
      await clearRoomInConvex();
    } catch (error) {
      console.error("Failed to clear room in Convex:", error);
    }
  }, [currentRoom, clearRoomInConvex]);

  return (
    <RoomContext.Provider
      value={{
        placedModels,
        selectedModel,
        setSelectedModel,
        isPlacementMode,
        setIsPlacementMode,
        addModel,
        removeModel,
        updateModelPosition,
        updatePlacedModel,
        currentRoom,
        getCurrentRoomCoords,
        updateCurrentRoom,
        registerRoom,
        availableRooms,
        getModelsInCurrentRoom,
        // Convex-specific functions
        clearRoom,
        isRoomDataLoading,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error("useRoom must be used within a RoomProvider");
  }
  return context;
};

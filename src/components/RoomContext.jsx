import React, { createContext, useContext, useState, useCallback } from "react";

const RoomContext = createContext(null);

export function RoomProvider({ children }) {
  // Track placed models
  const [placedModels, setPlacedModels] = useState([]);
  // Track currently selected model from catalog
  const [selectedModel, setSelectedModel] = useState(null);
  // Track placement mode
  const [isPlacementMode, setIsPlacementMode] = useState(false);

  // Add a new model to the room
  const addModel = useCallback((modelData, position, rotation) => {
    const newModel = {
      ...modelData, // First spread all properties from modelData
      id: `model-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Then override or add specific properties
      modelId: modelData.id, // Keep a reference to the original model ID
      position,
      rotation,
    };

    setPlacedModels((prev) => [...prev, newModel]);
    return newModel.id;
  }, []);

  // Remove a model from the room
  const removeModel = useCallback((modelId) => {
    setPlacedModels((prev) => prev.filter((model) => model.id !== modelId));
  }, []);

  // Move an existing model
  const updateModelPosition = useCallback((modelId, position, rotation) => {
    setPlacedModels((prev) =>
      prev.map((model) =>
        model.id === modelId ? { ...model, position, rotation } : model
      )
    );
  }, []);

  // Update all placed models (useful for loading saved designs)
  const updateAllModels = useCallback((newModels) => {
    setPlacedModels(newModels);
  }, []);

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
        updateAllModels,
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

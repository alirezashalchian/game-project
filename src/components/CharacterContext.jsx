import React, { createContext, useContext, useState } from "react";

const CharacterContext = createContext(null);

export function CharacterProvider({ children }) {
  // Current gravity state
  const [currentGravity, setCurrentGravity] = useState([0, -9.8, 0]);

  // Current floor surface state (which surface the character is walking on)
  const [currentFloorSurface, setCurrentFloorSurface] = useState("bottom");

  const value = {
    // State
    currentGravity,
    currentFloorSurface,

    // Actions
    setCurrentGravity,
    setCurrentFloorSurface,
  };

  return (
    <CharacterContext.Provider value={value}>
      {children}
    </CharacterContext.Provider>
  );
}
export const useCharacter = () => {
  const context = useContext(CharacterContext);
  if (!context) {
    throw new Error("useCharacter must be used within a CharacterProvider");
  }
  return context;
};

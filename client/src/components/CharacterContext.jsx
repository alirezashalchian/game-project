import React, { createContext, useContext, useState } from "react";

const CharacterContext = createContext(null);

export function CharacterProvider({ children }) {
  // Mage gravity state
  const [mageGravity, setMageGravity] = useState([0, -9.8, 0]);
  const [mageFloorSurface, setMageFloorSurface] = useState("bottom");

  // Barbarian gravity state
  const [barbarianGravity, setBarbarianGravity] = useState([0, -9.8, 0]);
  const [barbarianFloorSurface, setBarbarianFloorSurface] = useState("bottom");

  // Controls disabled state (for overlays like character shop)
  const [controlsDisabled, setControlsDisabled] = useState(false);

  const value = {
    // Mage state
    mageGravity,
    mageFloorSurface,
    setMageGravity,
    setMageFloorSurface,

    // Barbarian state
    barbarianGravity,
    barbarianFloorSurface,
    setBarbarianGravity,
    setBarbarianFloorSurface,

    // Controls state
    controlsDisabled,
    setControlsDisabled,

    // Legacy support (for backward compatibility if needed)
    currentGravity: mageGravity,
    currentFloorSurface: mageFloorSurface,
    setCurrentGravity: setMageGravity,
    setCurrentFloorSurface: setMageFloorSurface,
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

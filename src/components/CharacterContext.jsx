import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
} from "react";

const CharacterContext = createContext(null);

export function CharacterProvider({ children }) {
  // Wall touch state for gravity change UI
  const [wallTouchData, setWallTouchData] = useState(null);

  // Current gravity state
  const [currentGravity, setCurrentGravity] = useState([0, -9.8, 0]);

  // Debouncing for wall touch to prevent rapid switching
  const wallTouchTimeout = useRef(null);
  const lastWallTouchTime = useRef(0);
  const WALL_TOUCH_DEBOUNCE_TIME = 200; // 200ms debounce

  // Store transition callback
  const transitionCallbackRef = useRef(null);

  // Handle gravity change confirmation
  const handleGravityChange = useCallback((wallType) => {
    console.log(`[CharacterContext] Gravity change triggered for: ${wallType}`);

    const directions = {
      front: [0, 0, 9.8], // gravity towards front wall
      back: [0, 0, -9.8], // gravity towards back wall
      right: [9.8, 0, 0], // gravity towards right wall
      left: [-9.8, 0, 0], // gravity towards left wall
      top: [0, 9.8, 0], // gravity towards ceiling
      bottom: [0, -9.8, 0], // gravity towards floor
    };

    const newGravity = directions[wallType];
    if (newGravity) {
      console.log(`[CharacterContext] Setting gravity to: [${newGravity}]`);
      setCurrentGravity(newGravity);

      // Call transition callback if it exists
      if (transitionCallbackRef.current) {
        console.log(
          `[CharacterContext] Calling transition callback for: ${wallType}`
        );
        transitionCallbackRef.current(wallType);
      } else {
        console.log(`[CharacterContext] No transition callback registered`);
      }
    }
    setWallTouchData(null);
  }, []);

  // Function to register transition callback
  const registerTransitionCallback = useCallback((callback) => {
    transitionCallbackRef.current = callback;
  }, []);

  // Handle wall touch updates with debouncing
  const updateWallTouchData = useCallback(
    (wallType, roomId, currentFloorSurface) => {
      // Exclude the current floor surface from triggering wall touch
      if (wallType !== currentFloorSurface) {
        const now = Date.now();

        // Clear existing timeout
        if (wallTouchTimeout.current) {
          clearTimeout(wallTouchTimeout.current);
        }

        // Only update if enough time has passed or it's a different wall type
        if (
          now - lastWallTouchTime.current > WALL_TOUCH_DEBOUNCE_TIME ||
          !wallTouchData ||
          wallTouchData.wallType !== wallType
        ) {
          console.log(`Setting wall touch data for: ${wallType}`);
          wallTouchTimeout.current = setTimeout(() => {
            setWallTouchData({ wallType, roomId });
            lastWallTouchTime.current = now;
          }, 50);
        }
      } else {
        console.log(`Wall collision ignored (current floor): ${wallType}`);
      }
    },
    [wallTouchData, WALL_TOUCH_DEBOUNCE_TIME]
  );

  // Clear wall touch data
  const clearWallTouchData = useCallback(
    (wallType, roomId) => {
      // Only clear if this was the active wall touch
      if (
        wallTouchData &&
        wallTouchData.wallType === wallType &&
        wallTouchData.roomId === roomId
      ) {
        if (wallTouchTimeout.current) {
          clearTimeout(wallTouchTimeout.current);
        }

        wallTouchTimeout.current = setTimeout(() => {
          setWallTouchData(null);
        }, 100);
      }
    },
    [wallTouchData]
  );

  // Cleanup effect for wall touch timeouts
  React.useEffect(() => {
    return () => {
      if (wallTouchTimeout.current) {
        clearTimeout(wallTouchTimeout.current);
      }
    };
  }, []);

  const value = {
    // State
    wallTouchData,
    currentGravity,

    // Actions
    handleGravityChange,
    updateWallTouchData,
    clearWallTouchData,
    setCurrentGravity,
    registerTransitionCallback,
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

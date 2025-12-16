import React, { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { KeyboardControls } from "@react-three/drei";
import { RoomProvider } from "./RoomContext";
import { CharacterProvider } from "./CharacterContext";
import { SaveSystem } from "./SaveSystem";
import { ModelSelectorUI } from "./ModelSelectorUI";
import { GravityChangeUI } from "./GravityChangeUI";
import VoiceToggle from "./VoiceToggle";
import RemoteAudio from "./RemoteAudio";
import RoomWithPhysics from "./Rooms";
import GameLoadingPage from "./LoadingPage";
import GuestTutorial from "./GuestTutorial";
import CharacterShopOverlay from "./CharacterShopOverlay";
import { useGameLoading } from "../hooks/useGameLoading";

export default function GamePage() {
  const location = useLocation();
  
  // Get entry state from navigation
  const entryState = useMemo(() => {
    const state = location.state || {};
    return {
      isGuest: state.isGuest !== false, // Default to guest if not specified
      walletAddress: state.walletAddress || null,
      characterId: state.characterId || null,
      characterType: state.characterType || null,
      ownedRoomId: state.ownedRoomId || null,
    };
  }, [location.state]);

  // Determine target room based on entry state
  // Wallet users with owned room spawn there, otherwise default room
  const targetRoomId = useMemo(() => {
    if (!entryState.isGuest && entryState.ownedRoomId) {
      return entryState.ownedRoomId;
    }
    return "room-4-4-4"; // Default room
  }, [entryState]);

  // Parse room coords from roomId
  const targetRoomCoords = useMemo(() => {
    const match = targetRoomId.match(/room-(\d+)-(\d+)-(\d+)/);
    if (match) {
      return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
    }
    return [4, 4, 4]; // Default
  }, [targetRoomId]);

  const {
    isLoading,
    loadingProgress,
    loadingStage,
    loadingErrors,
    hasErrors,
  } = useGameLoading({ targetRoomCoords });

  const [showCharacterShop, setShowCharacterShop] = useState(false);

  const handleGetCharacter = () => {
    setShowCharacterShop(true);
  };

  const handleCloseCharacterShop = () => {
    setShowCharacterShop(false);
  };

  useEffect(() => {
    if (!isLoading) {
      document.body.classList.add("game-mode");
    }
    return () => {
      document.body.classList.remove("game-mode");
    };
  }, [isLoading]);

  if (isLoading) {
    return (
      <GameLoadingPage
        progress={loadingProgress}
        stage={loadingStage}
        errors={loadingErrors}
        hasErrors={hasErrors}
        onComplete={() => {}}
      />
    );
  }

  // Simplified - no preloaded data
  return (
    <RoomProvider>
      <CharacterProvider>
        <KeyboardControls
          map={[
            { name: "mageForward", keys: ["KeyW"] },
            { name: "mageBackward", keys: ["KeyS"] },
            { name: "mageLeftward", keys: ["KeyA"] },
            { name: "mageRightward", keys: ["KeyD"] },
            { name: "mageJump", keys: ["Space"] },
            { name: "mageGravityChange", keys: ["KeyG"] },
            { name: "barbarianForward", keys: ["ArrowUp"] },
            { name: "barbarianBackward", keys: ["ArrowDown"] },
            { name: "barbarianLeftward", keys: ["ArrowLeft"] },
            { name: "barbarianRightward", keys: ["ArrowRight"] },
            { name: "barbarianJump", keys: ["ShiftLeft", "ShiftRight"] },
            { name: "barbarianGravityChange", keys: ["KeyH"] },
          ]}
        >
          <ModelSelectorUI />
          <Canvas
            shadows={false}
            camera={{ fov: 75 }}
            style={{ position: "fixed", top: 0, left: 0 }}
            gl={{
              antialias: false,
              powerPreference: "high-performance",
              stencil: false,
              depth: true,
            }}
            dpr={[1, 1.5]}
            performance={{ min: 0.5 }}
            frameloop="always"
          >
            <Physics gravity={[0, 0, 0]} timeStep="vary">
              <RoomWithPhysics />
            </Physics>
          </Canvas>
          <SaveSystem />
          <GravityChangeUI />
          <VoiceToggle />
          <RemoteAudio />
          {/* Only show tutorial for guest users - wallet users skip it */}
          {entryState.isGuest && <GuestTutorial onGetCharacter={handleGetCharacter} />}
          <CharacterShopOverlay 
            isOpen={showCharacterShop} 
            onClose={handleCloseCharacterShop} 
          />
        </KeyboardControls>
      </CharacterProvider>
    </RoomProvider>
  );
}

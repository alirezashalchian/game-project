import React, { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { KeyboardControls } from "@react-three/drei";
import { RoomProvider } from "./RoomContext";
import { CharacterProvider } from "./CharacterContext";
import { SaveSystem } from "./SaveSystem";
import { ModelSelectorUI } from "./ModelSelectorUI";
import { GravityChangeUI } from "./GravityChangeUI";
import RoomWithPhysics from "./Rooms";
import GameLoadingPage from "./LoadingPage";
import { useGameLoading } from "../hooks/useGameLoading";

export default function GamePage() {
  const {
    isLoading,
    loadingProgress,
    loadingStage,
    loadingErrors,
    hasErrors,
    // roomData removed - not needed
  } = useGameLoading();

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
        </KeyboardControls>
      </CharacterProvider>
    </RoomProvider>
  );
}

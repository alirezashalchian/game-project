import { createRoot } from "react-dom/client";
import { Canvas } from "@react-three/fiber";
import "./main.css";
import "./index.css";
import { Physics } from "@react-three/rapier";
import RoomWithPhysics from "./App.jsx";
import { KeyboardControls } from "@react-three/drei";
import { RoomProvider } from "./components/RoomContext";
import { CharacterProvider } from "./components/CharacterContext";
import { SaveSystem } from "./components/SaveSystem";
import { ModelSelectorUI } from "./components/ModelSelectorUI";
import { GravityChangeUI } from "./components/GravityChangeUI";
import { ConvexWrapper } from "./context/ConvexContext";
import { useState, useEffect } from "react";
import GameLoadingPage from "./components/game-loading-page";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

function GameApp() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    const loadGame = async () => {
      // Replace these with your actual loading events:

      // Step 1: Initialize WebGL context
      setLoadingProgress(20);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Step 2: Load 3D models and textures
      setLoadingProgress(50);
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Step 3: Initialize physics engine
      setLoadingProgress(70);
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Step 4: Connect to multiplayer (Colyseus)
      setLoadingProgress(90);
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Step 5: Final setup
      setLoadingProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 300));

      setIsLoading(false);
    };

    loadGame();
  }, []);

  if (isLoading) {
    return <GameLoadingPage progress={loadingProgress} />;
  }

  return (
    <ConvexWrapper>
      <RoomProvider>
        <CharacterProvider>
          <KeyboardControls
            map={[
              // Mage controls (WASD + G)
              { name: "mageForward", keys: ["KeyW"] },
              { name: "mageBackward", keys: ["KeyS"] },
              { name: "mageLeftward", keys: ["KeyA"] },
              { name: "mageRightward", keys: ["KeyD"] },
              { name: "mageJump", keys: ["Space"] },
              { name: "mageGravityChange", keys: ["KeyG"] },
              // Barbarian controls (Arrow keys + H)
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
              shadows
              camera={{ fov: 75 }}
              style={{ position: "fixed", top: 0, left: 0 }}
            >
              <Physics gravity={[0, 0, 0]}>
                <RoomWithPhysics />
              </Physics>
            </Canvas>
            {/* UI Components */}
            <SaveSystem />
            <GravityChangeUI />
          </KeyboardControls>
        </CharacterProvider>
      </RoomProvider>
    </ConvexWrapper>
  );
}

const root = createRoot(rootElement);
root.render(<GameApp />);

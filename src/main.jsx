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
import "./client.js";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

const root = createRoot(rootElement);
root.render(
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
          camera={{ position: [0, 4, -10], fov: 45 }}
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
);

import { createRoot } from "react-dom/client";
import { Canvas } from "@react-three/fiber";
import "./main.css";
import "./index.css";
import { Physics } from "@react-three/rapier";
import RoomWithPhysics from "./App.jsx";
import { KeyboardControls } from "@react-three/drei";
import { RoomProvider } from "./components/RoomContext";
import { SaveSystem } from "./components/SaveSystem";
import { ModelSelectorUI } from "./components/ModelSelectorUI";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

const root = createRoot(rootElement);
root.render(
  <RoomProvider>
    <KeyboardControls
      map={[
        { name: "forward", keys: ["ArrowUp", "KeyW"] },
        { name: "backward", keys: ["ArrowDown", "KeyS"] },
        { name: "leftward", keys: ["ArrowLeft", "KeyA"] },
        { name: "rightward", keys: ["ArrowRight", "KeyD"] },
        { name: "jump", keys: ["Space"] },
      ]}
    >
      <ModelSelectorUI />
      <Canvas
        shadows
        camera={{ position: [0, 4, -10], fov: 45 }}
        style={{ position: "fixed", top: 0, left: 0 }}
      >
        <Physics gravity={[0, -9.8, 0]}>
          <RoomWithPhysics />
        </Physics>
      </Canvas>
      {/* UI Components */}
      <SaveSystem />
    </KeyboardControls>
  </RoomProvider>
);

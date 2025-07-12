import React from "react";
import Mage from "./components/AiMage";
import { PlacementSystem } from "./components/PlacementSystem";
import { PlacedModelsManager } from "./components/PlacedModelsManager";
import { DynamicRoomManager } from "./components/Room/DynamicRoomManager";

export default function RoomWithPhysics() {
  return (
    <>
      {/* Global lighting */}
      {/* <directionalLight
        position={[10, 20, 10]}
        intensity={0.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
      /> */}
      <ambientLight intensity={0.3} />
      <DynamicRoomManager />
      <Mage />
      <PlacementSystem />
      <PlacedModelsManager />
      <axesHelper args={[10]} />
    </>
  );
}

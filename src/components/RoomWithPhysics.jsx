import React from "react";
import Mage from "./Character";
import MultiplayerManager from "./MultiplayerManager";
import { PlacementSystem } from "./PlacementSystem";
import { PlacedModelsManager } from "./PlacedModelsManager";
import { DynamicRoomManager } from "./Room/DynamicRoomManager";

export default function RoomWithPhysics() {
  return (
    <>
      {/* Global lighting */}
      <ambientLight intensity={0.3} />
      <DynamicRoomManager />
      <Mage />
      <MultiplayerManager />
      <PlacementSystem />
      <PlacedModelsManager />
    </>
  );
}

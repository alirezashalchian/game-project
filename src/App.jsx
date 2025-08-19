import React from "react";
import Mage from "./components/Character";
import MultiplayerManager from "./components/MultiplayerManager"; // Add this import
import { ColyseusProvider } from "./context/ColyseusContext"; // Add this import
import { PlacementSystem } from "./components/PlacementSystem";
import { PlacedModelsManager } from "./components/PlacedModelsManager";
import { DynamicRoomManager } from "./components/Room/DynamicRoomManager";

export default function RoomWithPhysics() {
  return (
    <ColyseusProvider>
      {" "}
      {/* Wrap everything in ColyseusProvider */}
      {/* Global lighting */}
      <ambientLight intensity={0.3} />
      <DynamicRoomManager />
      <Mage />
      <MultiplayerManager /> {/* Add this component to render other players */}
      <PlacementSystem />
      <PlacedModelsManager />
      <axesHelper args={[10]} />
    </ColyseusProvider>
  );
}

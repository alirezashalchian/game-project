import React from "react";
import Mage from "./Character";
import MultiplayerManager from "./MultiplayerManager";
import { PlacementSystem } from "./PlacementSystem";
import { PlacedModelsManager } from "./PlacedModelsManager";
import { DynamicRoomManager } from "./Room/DynamicRoomManager";

export default function RoomWithPhysics() {
  return (
    <>
      {/* OPTIMIZED Global lighting - single ambient + single hemisphere light */}
      <ambientLight intensity={0.5} />
      <hemisphereLight 
        skyColor="#ffffff" 
        groundColor="#888888" 
        intensity={0.6} 
      />
      <DynamicRoomManager />
      <Mage />
      <MultiplayerManager />
      <PlacementSystem />
      <PlacedModelsManager />
    </>
  );
}

//RoomWithPhysics is not a good name. there is no physics in this component. 
//it is just a room with a dynamic room manager and a placed models manager. choose a better name.
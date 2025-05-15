import React, { useRef } from "react";
import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import Mage from "./components/AiMage";
import { PlacementSystem } from "./components/PlacementSystem";
import { PlacedModelsManager } from "./components/PlacedModelsManager";

// Constants
const ROOM_CONFIG = {
  size: 15.5,
  wallThickness: 0.5,
  holeSize: 2,
  wallColors: {
    front: "transparent",
    back: "transparent",
    right: "transparent",
    left: "transparent",
    top: "transparent",
    bottom: "transparent",
  },
  gridCellSize: 0.5,
};

// Wall configuration
const WALL_CONFIGS = [
  {
    position: [0, 0, ROOM_CONFIG.size / 2],
    rotation: [0, 0, 0],
    type: "front",
  },
  {
    position: [0, 0, -ROOM_CONFIG.size / 2],
    rotation: [0, Math.PI, 0],
    type: "back",
  },
  {
    position: [ROOM_CONFIG.size / 2, 0, 0],
    rotation: [0, Math.PI / 2, 0],
    type: "right",
  },
  {
    position: [-ROOM_CONFIG.size / 2, 0, 0],
    rotation: [0, -Math.PI / 2, 0],
    type: "left",
  },
  {
    position: [0, ROOM_CONFIG.size / 2, 0],
    rotation: [Math.PI / 2, 0, 0],
    type: "top",
  },
  {
    position: [0, -ROOM_CONFIG.size / 2, 0],
    rotation: [-Math.PI / 2, 0, 0],
    type: "bottom",
  },
];

// Wall component
const Wall = ({ position, rotation, type }) => {
  const halfSize = ROOM_CONFIG.size / 2;
  const sidePieceSize = (ROOM_CONFIG.size - ROOM_CONFIG.holeSize) / 2;

  return (
    <group position={position} rotation={rotation}>
      {/* Top piece */}
      <RigidBody type="fixed">
        <mesh position={[0, halfSize - sidePieceSize / 2, 0]}>
          <boxGeometry
            args={[ROOM_CONFIG.size, sidePieceSize, ROOM_CONFIG.wallThickness]}
          />
          <meshStandardMaterial
            color={ROOM_CONFIG.wallColors[type]}
            transparent={true}
            opacity={0.75}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Bottom piece */}
        <mesh position={[0, -halfSize + sidePieceSize / 2, 0]}>
          <boxGeometry
            args={[ROOM_CONFIG.size, sidePieceSize, ROOM_CONFIG.wallThickness]}
          />
          <meshStandardMaterial
            color={ROOM_CONFIG.wallColors[type]}
            transparent={true}
            opacity={0.75}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Left piece */}
        <mesh position={[-halfSize + sidePieceSize / 2, 0, 0]}>
          <boxGeometry
            args={[
              sidePieceSize,
              ROOM_CONFIG.holeSize,
              ROOM_CONFIG.wallThickness,
            ]}
          />
          <meshStandardMaterial
            color={ROOM_CONFIG.wallColors[type]}
            transparent={true}
            opacity={0.75}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Right piece */}
        <mesh position={[halfSize - sidePieceSize / 2, 0, 0]}>
          <boxGeometry
            args={[
              sidePieceSize,
              ROOM_CONFIG.holeSize,
              ROOM_CONFIG.wallThickness,
            ]}
          />
          <meshStandardMaterial
            color={ROOM_CONFIG.wallColors[type]}
            transparent={true}
            opacity={0.75}
            side={THREE.DoubleSide}
          />
        </mesh>
      </RigidBody>
      {/* Central hole */}
    </group>
  );
};

// Room component
const Room = ({ roomRef }) => (
  <group ref={roomRef}>
    {WALL_CONFIGS.map((config, index) => (
      <Wall key={index} {...config} />
    ))}
  </group>
);

// Main component
export default function RoomWithPhysics() {
  const roomRef = useRef();

  return (
    <>
      {/* 3D Scene */}
      <ambientLight intensity={1} />

      <Room roomRef={roomRef} />
      <Mage />
      {/* <GridSystem size={ROOM_CONFIG.size} cellSize={ROOM_CONFIG.gridCellSize} /> */}
      <PlacementSystem />
      <PlacedModelsManager />
      <axesHelper args={[10]} />
    </>
  );
}

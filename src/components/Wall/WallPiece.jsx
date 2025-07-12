import React from "react";
import * as THREE from "three";
import { roomConfig } from "../Room/roomConfig";

export const WallPiece = ({ position, size, type }) => (
  <mesh position={position} castShadow receiveShadow>
    <boxGeometry args={size} />
    <meshStandardMaterial
      color={roomConfig.wallColors[type]}
      transparent={true}
      roughness={0.75}
      metalness={0.1}
      side={THREE.DoubleSide}
    />
  </mesh>
);

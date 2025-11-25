import React from "react";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { roomConfig } from "../Room/roomConfig";
import { WallPiece } from "./WallPiece";

export const Wall = ({ position, rotation, type, hasDoor = true, roomId, isBlocked = false }) => {
  const halfInnerSize = roomConfig.innerSize / 2;
  const sidePieceWidth = (roomConfig.innerSize - roomConfig.doorSize) / 2;

  return (
    <group position={position} rotation={rotation}>
      <RigidBody
        type="fixed"
        userData={{ isWall: true, wallType: type, roomId }}
      >
        {hasDoor ? (
          // Wall with door opening (for walls that should have doors)
          <>
            {/* Top piece */}
            <WallPiece
              position={[0, halfInnerSize - sidePieceWidth / 2, 0]}
              size={[
                roomConfig.innerSize,
                sidePieceWidth,
                roomConfig.wallThickness,
              ]}
              type={type}
            />

            {/* Bottom piece */}
            <WallPiece
              position={[0, -halfInnerSize + sidePieceWidth / 2, 0]}
              size={[
                roomConfig.innerSize,
                sidePieceWidth,
                roomConfig.wallThickness,
              ]}
              type={type}
            />

            {/* Left piece */}
            <WallPiece
              position={[-halfInnerSize + sidePieceWidth / 2, 0, 0]}
              size={[
                sidePieceWidth,
                roomConfig.doorSize,
                roomConfig.wallThickness,
              ]}
              type={type}
            />

            {/* Right piece */}
            <WallPiece
              position={[halfInnerSize - sidePieceWidth / 2, 0, 0]}
              size={[
                sidePieceWidth,
                roomConfig.doorSize,
                roomConfig.wallThickness,
              ]}
              type={type}
            />

             {/* THE SOLID BLOCKER: Only rendered if isBlocked is true */}
             {isBlocked && (
              <>
                 {/* 1. SOLID COLLIDER to physically block players */}
                 {/* Note: sensor={false} makes it solid */}
                 <CuboidCollider
                   args={[
                     roomConfig.doorSize / 2, 
                     roomConfig.doorSize / 2, 
                     roomConfig.wallThickness / 2
                   ]}
                   position={[0, 0, 0]}
                   sensor={false} 
                 />
                 
                 {/* 2. Visual Feedback (Red Force Field) */}
                 <mesh position={[0, 0, 0]}>
                   <boxGeometry args={[
                     roomConfig.doorSize, 
                     roomConfig.doorSize, 
                     roomConfig.wallThickness
                   ]} />
                   <meshStandardMaterial 
                     color="#ff0000" 
                     opacity={0.5} 
                     transparent={true}
                     emissive="#ff0000" 
                     emissiveIntensity={0.2} 
                   />
                 </mesh>
              </>
            )}
          </>
        ) : (
          // Solid wall (no door) - for phantom-adjacent walls
          <WallPiece
            position={[0, 0, 0]}
            size={[
              roomConfig.innerSize,
              roomConfig.innerSize,
              roomConfig.wallThickness,
            ]}
            type={type}
          />
        )}
      </RigidBody>
    </group>
  );
};

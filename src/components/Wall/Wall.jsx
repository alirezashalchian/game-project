import React from "react";
import { RigidBody } from "@react-three/rapier";
import { roomConfig } from "../Room/roomConfig";
import { WallPiece } from "./WallPiece";

export const Wall = ({ position, rotation, type, hasDoor = true, roomId }) => {
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

import React, { useState } from "react";
import { useGLTF } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { useRoom } from "./RoomContext";

export function PlacedModelsManager() {
  const { placedModels, removeModel, isPlacementMode } = useRoom();
  const [selectedPlacedModelId, setSelectedPlacedModelId] = useState(null);

  // Clear selection when entering placement mode
  React.useEffect(() => {
    if (isPlacementMode) {
      setSelectedPlacedModelId(null);
    }
  }, [isPlacementMode]);

  return (
    <group>
      {placedModels.map((model) => (
        <PlacedModel
          key={model.id}
          model={model}
          isSelected={selectedPlacedModelId === model.id}
          onClick={() => {
            if (!isPlacementMode) {
              setSelectedPlacedModelId(
                selectedPlacedModelId === model.id ? null : model.id
              );
            }
          }}
          onDelete={() => {
            removeModel(model.id);
            setSelectedPlacedModelId(null);
          }}
        />
      ))}
    </group>
  );
}

function PlacedModel({ model, isSelected, onClick, onDelete }) {
  const { scene } = useGLTF(model.path);
  const [isHovered, setIsHovered] = useState(false);
  const { isPlacementMode } = useRoom();

  // Clone the scene for this instance
  const clonedScene = React.useMemo(() => scene.clone(), [scene]);

  // Set user data for raycasting
  React.useEffect(() => {
    clonedScene.traverse((object) => {
      if (object.isMesh) {
        object.userData.isPlacedModel = true;
        object.userData.modelId = model.id;
      }
    });
  }, [clonedScene, model.id]);

  return (
    <group
      position={model.position}
      rotation={model.rotation}
      onClick={(e) => {
        // Only process click if not in placement mode
        if (!isPlacementMode) {
          e.stopPropagation();
          onClick();
        }
      }}
      onPointerOver={() => !isPlacementMode && setIsHovered(true)}
      onPointerOut={() => !isPlacementMode && setIsHovered(false)}
    >
      <RigidBody type="fixed" colliders="hull">
        <primitive object={clonedScene} scale={model.scale} />
      </RigidBody>

      {/* Selection indicator - only show when not in placement mode */}
      {!isPlacementMode && (isSelected || isHovered) && (
        <mesh position={[0, 0.01, 0]} rotation={[0, 0, 0]}>
          <boxGeometry
            args={[
              model.gridSize.width * 0.5 + 0.01,
              model.gridSize.width * 0.5 + 0.01,
              model.gridSize.width * 0.5 + 0.01,
            ]}
          />
          <meshBasicMaterial
            color={isSelected ? "#7289da" : "#aaaaaa"}
            transparent={true}
            opacity={0.5}
          />
        </mesh>
      )}

      {/* Controls that appear when selected - only shown when not in placement mode */}
      {!isPlacementMode && isSelected && (
        <group position={[0, model.gridSize.height * 0.25 + 0.5, 0]}>
          {/* Delete button */}
          <mesh
            position={[0, 0, 0]}
            onClick={(e) => {
              if (!isPlacementMode) {
                e.stopPropagation();
                onDelete();
              }
            }}
          >
            <boxGeometry args={[0.3, 0.3, 0.3]} />
            <meshStandardMaterial color="red" />
          </mesh>
        </group>
      )}
    </group>
  );
}

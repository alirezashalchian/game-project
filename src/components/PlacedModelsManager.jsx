import React, { useState, useRef, useEffect } from "react";
import { useGLTF, Html } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { useRoom } from "./RoomContext";
import { roomConfig } from "./Room/roomConfig";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Trash2, RotateCw, X } from "lucide-react";

// Glow colors
const SELECTED_COLOR = new THREE.Color("#7289da"); // Discord blurple
const HOVER_COLOR = new THREE.Color("#aaaaaa"); // Light gray

export function PlacedModelsManager() {
  const { placedModels, removeModel, isPlacementMode, updatePlacedModel } =
    useRoom();
  const [selectedPlacedModelId, setSelectedPlacedModelId] = useState(null);
  const [hoveredModelId, setHoveredModelId] = useState(null);
  const { raycaster, camera, pointer } = useThree();
  const groupRef = useRef();

  // Clear selection when entering placement mode
  useEffect(() => {
    if (isPlacementMode) {
      setSelectedPlacedModelId(null);
      setHoveredModelId(null);
    }
  }, [isPlacementMode]);

  // Handle raycasting to detect which model is being hovered
  const handlePointerMove = (e) => {
    if (isPlacementMode || !groupRef.current) return;

    // Update the picking ray with the camera and pointer position
    raycaster.setFromCamera(pointer, camera);

    // Create an array of objects to test intersection with
    const modelMeshes = [];
    groupRef.current.traverse((object) => {
      // Only include meshes with userData.isPlacedModel === true
      // This ensures we only check actual model meshes, not selection indicators
      if (object.isMesh && object.userData.isPlacedModel) {
        modelMeshes.push(object);
      }
    });

    // Get intersections and sort by distance
    const intersects = raycaster.intersectObjects(modelMeshes, false);

    // If we have at least one intersection, hover the closest model
    if (intersects.length > 0) {
      const firstHit = intersects[0];
      setHoveredModelId(firstHit.object.userData.modelId);

      // Prevent event propagation to avoid hovering multiple models
      e.stopPropagation();
    } else {
      setHoveredModelId(null);
    }
  };

  // Handle click on models
  const handleModelClick = (e) => {
    if (isPlacementMode || !hoveredModelId) return;

    // Toggle selection state of the hovered model
    setSelectedPlacedModelId(
      selectedPlacedModelId === hoveredModelId ? null : hoveredModelId
    );

    // Prevent event propagation
    e.stopPropagation();
  };

  // Handle pointer leaving the model group
  const handlePointerLeave = () => {
    if (!isPlacementMode) {
      setHoveredModelId(null);
    }
  };

  // Handle rotation of selected model
  const handleRotateModel = (modelId) => {
    const model = placedModels.find((model) => model.id === modelId);
    if (model) {
      const newRotation = [
        model.rotation[0],
        model.rotation[1] + Math.PI / 2, // Rotate 90 degrees on Y axis
        model.rotation[2],
      ];

      // Update the model's rotation using the context function
      const updatedModel = { ...model, rotation: newRotation };
      updatePlacedModel(updatedModel);
    }
  };

  // Listen for keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle keyboard shortcuts when a model is selected and not in placement mode
      if (selectedPlacedModelId && !isPlacementMode) {
        if (e.key === "Delete" || e.key === "Backspace") {
          // Delete the selected model
          removeModel(selectedPlacedModelId);
          setSelectedPlacedModelId(null);
          e.preventDefault();
        } else if (e.key === "r" || e.key === "R") {
          // Rotate the selected model
          handleRotateModel(selectedPlacedModelId);
          e.preventDefault();
        } else if (e.key === "Escape") {
          // Unselect the model
          setSelectedPlacedModelId(null);
          e.preventDefault();
          // Only prevent default if we're handling the event
          // This allows ESC to still work for exiting placement mode when needed
        }
      }
      // Note: We don't handle ESC when no model is selected or in placement mode
      // This allows the existing ESC functionality for exiting placement mode to work
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPlacedModelId, isPlacementMode, removeModel, handleRotateModel]);

  return (
    <group
      ref={groupRef}
      onPointerMove={handlePointerMove}
      onClick={handleModelClick}
      onPointerLeave={handlePointerLeave}
    >
      {placedModels.map((model) => (
        <PlacedModel
          key={model.id}
          model={model}
          isSelected={selectedPlacedModelId === model.id}
          isHovered={hoveredModelId === model.id}
          onDelete={() => {
            removeModel(model.id);
            setSelectedPlacedModelId(null);
          }}
          onRotate={() => handleRotateModel(model.id)}
          onUnselect={() => setSelectedPlacedModelId(null)}
        />
      ))}
    </group>
  );
}

function PlacedModel({
  model,
  isSelected,
  isHovered,
  onDelete,
  onRotate,
  onUnselect,
}) {
  const { scene } = useGLTF(model.path);
  const { isPlacementMode } = useRoom();
  const cellSize = roomConfig.cellSize;
  const modelRef = useRef();

  // Clone the scene for this instance
  const clonedScene = React.useMemo(() => scene.clone(), [scene]);

  // Set user data for raycasting
  React.useEffect(() => {
    clonedScene.traverse((object) => {
      if (object.isMesh) {
        object.userData.isPlacedModel = true;
        object.userData.modelId = model.id;

        // Store original material to restore later
        object.userData.originalMaterial = object.material;
      }
    });
  }, [clonedScene, model.id]);

  // Apply glow effect when selected or hovered
  React.useEffect(() => {
    if (isPlacementMode) return;

    clonedScene.traverse((object) => {
      if (object.isMesh) {
        // If selected or hovered, apply glow effect
        if (isSelected || isHovered) {
          // Create a copy of the original material to modify
          if (!object.userData.glowMaterial) {
            const originalMaterial = object.userData.originalMaterial;

            // Create a new material based on the original
            const glowMaterial = originalMaterial.clone();

            // Store the new material for reuse
            object.userData.glowMaterial = glowMaterial;
          }

          // Apply the glow material
          const material = object.userData.glowMaterial;

          // Set emissive color and intensity based on state
          if (isSelected) {
            material.emissive = SELECTED_COLOR;
            material.emissiveIntensity = 0.5;
          } else if (isHovered) {
            material.emissive = HOVER_COLOR;
            material.emissiveIntensity = 0.3;
          }

          // Apply the updated material
          object.material = material;
        } else {
          // Restore original material when not selected or hovered
          object.material = object.userData.originalMaterial;
        }
      }
    });

    // Cleanup function to restore original materials
    return () => {
      clonedScene.traverse((object) => {
        if (object.isMesh && object.userData.originalMaterial) {
          object.material = object.userData.originalMaterial;
        }
      });
    };
  }, [isSelected, isHovered, clonedScene, isPlacementMode]);

  // Calculate world dimensions based on grid dimensions
  const worldHeight = model.gridDimensions.height * cellSize;

  return (
    <group ref={modelRef} position={model.position} rotation={model.rotation}>
      <RigidBody type="fixed" colliders="hull">
        <primitive object={clonedScene} scale={model.scale} />
      </RigidBody>

      {/* Floating Context Menu - only show when selected and not in placement mode */}
      {!isPlacementMode && isSelected && (
        <Html
          position={[0, worldHeight / 2 + 0.3, 0]}
          center
          distanceFactor={10}
          className="select-none pointer-events-auto"
        >
          <div className="relative p-2 bg-black/40 backdrop-blur-md border border-gray-700 rounded-xl shadow-lg">
            {/* Close button to unselect */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-2 -right-2 h-5 w-5 bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full p-0"
              onClick={(e) => {
                e.stopPropagation();
                onUnselect();
              }}
              title="Close (ESC)"
            >
              <X size={12} />
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="bg-gray-800/80 text-white hover:bg-gray-700/90 border-gray-700 rounded-xl h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onRotate();
                }}
                title="Rotate (R)"
              >
                <RotateCw size={16} />
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="bg-red-600/80 text-white hover:bg-red-700/90 border-red-800 rounded-xl h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                title="Delete (Delete)"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

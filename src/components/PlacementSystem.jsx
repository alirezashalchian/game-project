import React, { useRef, useState, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
// import { useGLTF } from "@react-three/drei";
import { useRoom } from "./RoomContext";
import * as THREE from "three";

export function PlacementSystem() {
  const { camera, raycaster, pointer } = useThree();
  const {
    selectedModel,
    isPlacementMode,
    addModel,
    placedModels,
    setIsPlacementMode,
    setSelectedModel,
  } = useRoom();

  const [placementPosition, setPlacementPosition] = useState(null);
  const [placementRotation, setPlacementRotation] = useState([0, 0, 0]);
  const [isValidPlacement, setIsValidPlacement] = useState(true);
  const indicatorRef = useRef();

  // Define consistent grid and room dimensions
  const ROOM_SIZE = 15.5;
  const WALL_THICKNESS = 0.5;
  const gridSize = 0.5; // Size of each grid unit in Three.js units

  // Calculate floor height consistently
  const FLOOR_HEIGHT = -ROOM_SIZE / 2 + WALL_THICKNESS / 2;

  // // Load model for calculation purposes
  // const { scene: modelScene } = useGLTF(
  //   selectedModel ? selectedModel.path : "/models/characters/Mage.glb",
  //   { sRGBEncoding: true }
  // );

  // Handle rotation with R key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "r" && selectedModel?.rotatable && isPlacementMode) {
        setPlacementRotation((prev) => [
          prev[0],
          prev[1] + Math.PI / 2, // Rotate 90 degrees on Y axis
          prev[2],
        ]);
      }

      // Cancel placement with ESC
      if (e.key === "Escape" && isPlacementMode) {
        setIsPlacementMode(false);
        setSelectedModel(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedModel, isPlacementMode, setIsPlacementMode, setSelectedModel]);

  // Ray casting for placement
  useFrame(() => {
    if (!isPlacementMode || !selectedModel) return;

    // Cast ray from mouse position
    raycaster.setFromCamera(pointer, camera);

    // Create a plane representing the floor
    const floorPlane = new THREE.Plane(
      new THREE.Vector3(0, 1, 0),
      -FLOOR_HEIGHT
    );

    // First, check for intersections with placed blocks
    const blockIntersections = [];
    placedModels.forEach((model) => {
      // Create a box geometry for collision detection
      const box = new THREE.Box3();
      const modelWidth = model.gridSize?.width || 1;
      const modelHeight = model.gridSize?.height || 1;
      const modelDepth = model.gridSize?.depth || 1;

      // Set box dimensions based on model size
      const expansionAmount = 0.02; // Small expansion to make hitting more consistent to solve the preview plane glitching
      box.min.set(
        model.position[0] - (modelWidth * gridSize) / 2 - expansionAmount,
        model.position[1] - (modelHeight * gridSize) / 2 - expansionAmount,
        model.position[2] - (modelDepth * gridSize) / 2 - expansionAmount
      );
      box.max.set(
        model.position[0] + (modelWidth * gridSize) / 2 + expansionAmount,
        model.position[1] + (modelHeight * gridSize) / 2 + expansionAmount,
        model.position[2] + (modelDepth * gridSize) / 2 + expansionAmount
      );

      const intersection = raycaster.ray.intersectBox(box, new THREE.Vector3());
      if (intersection) {
        blockIntersections.push({
          point: intersection,
          model: model,
          distance: intersection.distanceTo(camera.position),
        });
      }
    });

    // Sort intersections by distance to camera
    blockIntersections.sort((a, b) => a.distance - b.distance);

    let placementPoint;
    if (blockIntersections.length > 0) {
      // We hit a block, use the top face for placement
      const hit = blockIntersections[0];

      // Calculate placement point on top of the hit block
      const modelHeight = hit.model.gridSize?.height || 1;
      placementPoint = new THREE.Vector3(
        hit.point.x,
        hit.model.position[1] + modelHeight * gridSize,
        hit.point.z
      );
    } else {
      // No block hit, fall back to floor plane
      const planeIntersection = new THREE.Vector3();
      raycaster.ray.intersectPlane(floorPlane, planeIntersection);
      placementPoint = planeIntersection;
    }

    if (placementPoint) {
      // Basic grid snapping with half-cell offset
      const cellSize = gridSize;
      const halfCell = cellSize / 2;

      const snappedX =
        Math.floor(placementPoint.x / cellSize) * cellSize + halfCell;
      const snappedZ =
        Math.floor(placementPoint.z / cellSize) * cellSize + halfCell;

      // Calculate Y position based on whether we're placing on floor or on a block
      let snappedY;
      if (blockIntersections.length > 0) {
        // Placing on top of another block
        const hit = blockIntersections[0];
        const modelHeight = hit.model.gridSize?.height || 1;
        snappedY = hit.model.position[1] + modelHeight * gridSize;
      } else {
        // Placing on floor
        const modelHeight = selectedModel.gridSize?.height || 1;
        snappedY = FLOOR_HEIGHT + (modelHeight * gridSize) / 2;
      }

      // Update placement position
      setPlacementPosition([snappedX, snappedY, snappedZ]);

      // Check for collisions
      setIsValidPlacement(
        checkValidPlacement(
          [snappedX, snappedY, snappedZ],
          placementRotation,
          selectedModel.gridSize
        )
      );
    }
  });

  // Check if placement position is valid
  const checkValidPlacement = (position, rotation, size) => {
    if (!size) return true;

    // Calculate boundaries of placement area (inner room)
    const innerRoomSize = ROOM_SIZE - WALL_THICKNESS;
    const maxDistance = innerRoomSize / 2;

    // Get model dimensions based on rotation
    const thisWidth = rotation[1] % Math.PI === 0 ? size.width : size.depth;
    const thisDepth = rotation[1] % Math.PI === 0 ? size.depth : size.width;
    const thisHeight = size.height || 1;

    // Calculate model half-sizes in world units
    const halfSizeX = (thisWidth * gridSize) / 2;
    const halfSizeZ = (thisDepth * gridSize) / 2;
    const halfSizeY = (thisHeight * gridSize) / 2;

    // Check if model would clip into walls
    if (
      Math.abs(position[0]) + halfSizeX > maxDistance ||
      Math.abs(position[2]) + halfSizeZ > maxDistance ||
      position[1] + halfSizeY > ROOM_SIZE / 2 // Check ceiling
    ) {
      return false;
    }

    // Check if model would be below floor
    if (position[1] - halfSizeY < FLOOR_HEIGHT) {
      return false;
    }

    // Check if there's a supporting surface beneath the block (full area support)
    const blockBottom = position[1] - halfSizeY;
    let allCellsSupported = true;
    for (let x = 0; x < thisWidth; x++) {
      for (let z = 0; z < thisDepth; z++) {
        // Calculate the world position of each cell under the block
        const cellX = position[0] - halfSizeX + gridSize / 2 + x * gridSize;
        const cellZ = position[2] - halfSizeZ + gridSize / 2 + z * gridSize;
        // Check if this cell is supported by the floor
        const supportedByFloor = Math.abs(blockBottom - FLOOR_HEIGHT) < 0.01;
        // Or by a block directly beneath
        const supportedByBlock = placedModels.some((model) => {
          const modelTop =
            model.position[1] + ((model.gridSize?.height || 1) * gridSize) / 2;
          const modelWidth =
            model.rotation[1] % Math.PI === 0
              ? model.gridSize.width
              : model.gridSize.depth;
          const modelDepth =
            model.rotation[1] % Math.PI === 0
              ? model.gridSize.depth
              : model.gridSize.width;
          const minX = model.position[0] - (modelWidth * gridSize) / 2;
          const maxX = model.position[0] + (modelWidth * gridSize) / 2;
          const minZ = model.position[2] - (modelDepth * gridSize) / 2;
          const maxZ = model.position[2] + (modelDepth * gridSize) / 2;
          return (
            Math.abs(modelTop - blockBottom) < 0.01 &&
            cellX >= minX &&
            cellX < maxX &&
            cellZ >= minZ &&
            cellZ < maxZ
          );
        });
        if (!supportedByFloor && !supportedByBlock) {
          allCellsSupported = false;
          break;
        }
      }
      if (!allCellsSupported) break;
    }
    if (!allCellsSupported) {
      return false;
    }

    // 3D collision check with other placed models
    return !placedModels.some((model) => {
      const dx = Math.abs(model.position[0] - position[0]);
      const dy = Math.abs(model.position[1] - position[1]);
      const dz = Math.abs(model.position[2] - position[2]);

      // Get existing model dimensions based on rotation
      const modelWidth =
        model.rotation[1] % Math.PI === 0
          ? model.gridSize.width
          : model.gridSize.depth;
      const modelDepth =
        model.rotation[1] % Math.PI === 0
          ? model.gridSize.depth
          : model.gridSize.width;
      const modelHeight = model.gridSize.height || 1;

      // Check overlap in all three dimensions
      return (
        dx < ((thisWidth + modelWidth) * gridSize) / 2 &&
        dy < ((thisHeight + modelHeight) * gridSize) / 2 &&
        dz < ((thisDepth + modelDepth) * gridSize) / 2
      );
    });
  };

  // Handle click to place model
  const handlePlaceModel = (e) => {
    e.stopPropagation();
    if (
      !isPlacementMode ||
      !selectedModel ||
      !placementPosition ||
      !isValidPlacement
    )
      return;

    // Add model to the room
    addModel(selectedModel, placementPosition, placementRotation);
  };

  // No preview if not in placement mode or no model selected
  if (!isPlacementMode || !selectedModel || !placementPosition) return null;

  // // Calculate surface position for indicator plane
  // const surfaceY =
  //   placementPosition[1] -
  //   (selectedModel.gridSize.height * gridSize) / 2 +
  //   0.01;

  return (
    <group
      position={placementPosition}
      rotation={placementRotation}
      ref={indicatorRef}
      onClick={handlePlaceModel}
    >
      {/* Placement indicator plane */}
      <mesh
        position={[
          0,
          -(selectedModel.gridSize.height * gridSize) / 2 + 0.01,
          0,
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[0.5, 0.5]} />
        <meshBasicMaterial
          color={isValidPlacement ? "green" : "red"}
          transparent={true}
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

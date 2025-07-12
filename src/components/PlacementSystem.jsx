import React, { useRef, useState, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
// import { useGLTF } from "@react-three/drei";
import { useRoom } from "./RoomContext";
import * as THREE from "three";
import { roomConfig } from "./Room/roomConfig";

export function PlacementSystem() {
  const { camera, raycaster, pointer } = useThree();
  const {
    selectedModel,
    isPlacementMode,
    addModel,
    setIsPlacementMode,
    setSelectedModel,
    currentRoom,
    getModelsInCurrentRoom,
  } = useRoom();

  // Setting initial position for placement preview
  const [placementPosition, setPlacementPosition] = useState([0, 0, 0]);
  const [placementRotation, setPlacementRotation] = useState([0, 0, 0]);
  const [isValidPlacement, setIsValidPlacement] = useState(true);
  const indicatorRef = useRef();

  // Define grid cell size from room config
  const cellSize = roomConfig.cellSize;

  // Log when placement mode or model changes
  useEffect(() => {
    // console.log(
    //   "Placement mode:",
    //   isPlacementMode,
    //   "Selected model:",
    //   selectedModel?.id
    // );
  }, [isPlacementMode, selectedModel]);

  // Calculate floor height based on current room
  const getFloorHeight = () => {
    if (!currentRoom) return 0;
    return currentRoom.position[1] - roomConfig.innerSize / 2;
  };

  // Handle rotation with R key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "r" && selectedModel?.rotatable && isPlacementMode) {
        // console.log("Rotating model");
        setPlacementRotation((prev) => [
          prev[0],
          prev[1] + Math.PI / 2, // Rotate 90 degrees on Y axis
          prev[2],
        ]);
      }

      // Cancel placement with ESC
      if (e.key === "Escape" && isPlacementMode) {
        // console.log("Canceling placement");
        setIsPlacementMode(false);
        setSelectedModel(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedModel, isPlacementMode, setIsPlacementMode, setSelectedModel]);

  // Ray casting for placement
  useFrame(() => {
    if (!isPlacementMode || !selectedModel) {
      return;
    }

    // Cast ray from mouse position
    raycaster.setFromCamera(pointer, camera);

    // Get models in the current room for collision detection
    const currentRoomModels = currentRoom ? getModelsInCurrentRoom() : [];

    // Get floor height (default to 0 if no current room)
    const FLOOR_HEIGHT = getFloorHeight();

    // Default floor plane at y=0 if no room is available yet
    const floorY = currentRoom ? -FLOOR_HEIGHT : 0;

    // Create a plane representing the floor
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), floorY);

    // First, check for intersections with placed blocks
    const blockIntersections = [];
    currentRoomModels.forEach((model) => {
      // Create a box geometry for collision detection
      const box = new THREE.Box3();
      const modelWidth = model.gridDimensions?.width || 1;
      const modelHeight = model.gridDimensions?.height || 1;
      const modelDepth = model.gridDimensions?.depth || 1;

      // Calculate world size based on grid dimensions
      const worldWidth = modelWidth * cellSize;
      const worldHeight = modelHeight * cellSize;
      const worldDepth = modelDepth * cellSize;

      // Set box dimensions based on model size
      const expansionAmount = 0.02; // Small expansion to make hitting more consistent
      box.min.set(
        model.position[0] - worldWidth / 2 - expansionAmount,
        model.position[1] - worldHeight / 2 - expansionAmount,
        model.position[2] - worldDepth / 2 - expansionAmount
      );
      box.max.set(
        model.position[0] + worldWidth / 2 + expansionAmount,
        model.position[1] + worldHeight / 2 + expansionAmount,
        model.position[2] + worldDepth / 2 + expansionAmount
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

    // Get placement point
    let placementPoint;

    if (blockIntersections.length > 0) {
      // We hit a block, use the top face for placement
      const hit = blockIntersections[0];

      // Calculate top of the hit model where new model will be placed
      const hitModelHeight = hit.model.gridDimensions?.height || 1;
      const topOfHitModel =
        hit.model.position[1] + (hitModelHeight * cellSize) / 2;

      placementPoint = new THREE.Vector3(
        hit.point.x,
        topOfHitModel,
        hit.point.z
      );
    } else {
      // No block hit, fall back to floor plane
      const planeIntersection = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(floorPlane, planeIntersection)) {
        placementPoint = planeIntersection;
        // console.log("Ray hit floor plane at:", planeIntersection);
      } else {
        // If ray doesn't hit the floor plane, use camera forward vector to
        // project a point in front of the camera
        // console.log("Ray missed floor plane, using camera forward");

        // Get camera direction
        const cameraDirection = new THREE.Vector3(0, 0, -1);
        cameraDirection.applyQuaternion(camera.quaternion);

        // Create a point 5 units in front of camera
        placementPoint = new THREE.Vector3();
        placementPoint.copy(camera.position);
        placementPoint.addScaledVector(cameraDirection, 5);

        // Project to floor height
        placementPoint.y = FLOOR_HEIGHT;
      }
    }

    if (placementPoint) {
      // Basic grid snapping with half-cell offset
      const halfCell = cellSize / 2;

      // Check if it's a medium scale model (2x2 grid)
      const isMediumScale =
        selectedModel.gridDimensions?.width === 2 &&
        selectedModel.gridDimensions?.height === 2 &&
        selectedModel.gridDimensions?.depth === 2;

      // Apply special offset for medium scale models to align with walls
      // For medium models (2x2), we need to shift them by half a grid cell
      let offsetX = 0;
      let offsetZ = 0;

      if (isMediumScale) {
        // Calculate which quadrant of the grid cell the pointer is in
        // This determines the offset direction
        const gridX = Math.floor(placementPoint.x / cellSize);
        const gridZ = Math.floor(placementPoint.z / cellSize);

        // Calculate the fractional position within the grid cell
        const fracX = placementPoint.x / cellSize - gridX;
        const fracZ = placementPoint.z / cellSize - gridZ;

        // Adjust the offset based on which side of the grid cell center we're on
        offsetX = fracX < 0.5 ? -halfCell : halfCell;
        offsetZ = fracZ < 0.5 ? -halfCell : halfCell;
      }

      // Apply normal snapping for small and large models
      // For medium models, add the calculated offset
      const snappedX =
        Math.floor(placementPoint.x / cellSize) * cellSize +
        halfCell +
        (isMediumScale ? offsetX : 0);

      const snappedZ =
        Math.floor(placementPoint.z / cellSize) * cellSize +
        halfCell +
        (isMediumScale ? offsetZ : 0);

      // Calculate Y position based on whether we're placing on floor or on a block
      let snappedY;
      if (blockIntersections.length > 0) {
        // Placing on top of another block
        const hit = blockIntersections[0];
        const hitModelHeight = hit.model.gridDimensions?.height || 1;
        // Calculate the top position of the hit model
        const topOfHitModel =
          hit.model.position[1] + (hitModelHeight * cellSize) / 2;

        // Place the new model directly on top of the hit model
        // The bottom of the new model should be at the top of the hit model
        const newModelHeight = selectedModel.gridDimensions?.height || 1;
        snappedY = topOfHitModel + (newModelHeight * cellSize) / 2;
      } else {
        // Placing on floor - adjust to place model directly on floor
        const modelHeight = selectedModel.gridDimensions?.height || 1;
        // Place bottom of model exactly at floor level
        snappedY = FLOOR_HEIGHT + (modelHeight * cellSize) / 2;
      }

      // Update placement position
      setPlacementPosition([snappedX, snappedY, snappedZ]);

      if (currentRoom) {
        // Check if the position is within the current room
        const isWithinCurrentRoom = checkIsWithinRoom(
          [snappedX, snappedY, snappedZ],
          currentRoom
        );

        // Check for collisions with other objects
        const hasCollisions = checkForCollisions(
          [snappedX, snappedY, snappedZ],
          placementRotation,
          selectedModel.gridDimensions,
          currentRoomModels
        );

        // Check if placement is supported from below
        const isSupported = checkIsSupported(
          [snappedX, snappedY, snappedZ],
          placementRotation,
          selectedModel.gridDimensions,
          currentRoomModels,
          FLOOR_HEIGHT
        );

        // Placement is valid if it's within room, has no collisions, and is supported
        setIsValidPlacement(
          isWithinCurrentRoom && !hasCollisions && isSupported
        );
      } else {
        // If no room is set yet, just allow placement anywhere
        setIsValidPlacement(true);
      }
    }
  });

  // Check if a position is within the current room boundaries
  const checkIsWithinRoom = (position, room) => {
    if (!room || !room.boundaries) return false;

    const { boundaries } = room;
    const [x, y, z] = position;

    // Get the size of the model in world units
    const width = selectedModel?.gridDimensions?.width || 1;
    const height = selectedModel?.gridDimensions?.height || 1;
    const depth = selectedModel?.gridDimensions?.depth || 1;

    // Calculate the model's half-dimensions in world units
    const halfWidth = (width * cellSize) / 2;
    const halfHeight = (height * cellSize) / 2;
    const halfDepth = (depth * cellSize) / 2;

    // Check if any part of the model would be outside room boundaries
    return (
      x - halfWidth >= boundaries.minX &&
      x + halfWidth <= boundaries.maxX &&
      y - halfHeight >= boundaries.minY &&
      y + halfHeight <= boundaries.maxY &&
      z - halfDepth >= boundaries.minZ &&
      z + halfDepth <= boundaries.maxZ
    );
  };

  // Check for collisions with other objects
  const checkForCollisions = (position, rotation, size, roomModels) => {
    if (!size) return false;

    // Calculate model dimensions based on rotation
    const thisWidth = rotation[1] % Math.PI === 0 ? size.width : size.depth;
    const thisDepth = rotation[1] % Math.PI === 0 ? size.depth : size.width;
    const thisHeight = size.height || 1;

    // Calculate model half-sizes in world units
    const halfSizeX = (thisWidth * cellSize) / 2;
    const halfSizeZ = (thisDepth * cellSize) / 2;
    const halfSizeY = (thisHeight * cellSize) / 2;

    // 3D collision check with other placed models
    return roomModels.some((model) => {
      const dx = Math.abs(model.position[0] - position[0]);
      const dy = Math.abs(model.position[1] - position[1]);
      const dz = Math.abs(model.position[2] - position[2]);

      // Get existing model dimensions based on rotation
      const modelWidth =
        model.rotation[1] % Math.PI === 0
          ? model.gridDimensions.width
          : model.gridDimensions.depth;
      const modelDepth =
        model.rotation[1] % Math.PI === 0
          ? model.gridDimensions.depth
          : model.gridDimensions.width;
      const modelHeight = model.gridDimensions.height || 1;

      // Calculate model half-sizes in world units
      const modelHalfWidth = (modelWidth * cellSize) / 2;
      const modelHalfDepth = (modelDepth * cellSize) / 2;
      const modelHalfHeight = (modelHeight * cellSize) / 2;

      // Check for overlap
      return (
        dx < halfSizeX + modelHalfWidth &&
        dy < halfSizeY + modelHalfHeight &&
        dz < halfSizeZ + modelHalfDepth
      );
    });
  };

  // Check if the model is supported from below
  const checkIsSupported = (
    position,
    rotation,
    size,
    roomModels,
    floorHeight
  ) => {
    if (!size) return true;

    // Get model dimensions based on rotation
    const thisWidth = rotation[1] % Math.PI === 0 ? size.width : size.depth;
    const thisDepth = rotation[1] % Math.PI === 0 ? size.depth : size.width;
    const thisHeight = size.height || 1;

    // Calculate model bottom Y position in world units
    const modelBottom = position[1] - (thisHeight * cellSize) / 2;

    // Is it resting on the floor? Use a very small tolerance to ensure models are exactly on the floor
    const isOnFloor = Math.abs(modelBottom - floorHeight) < 0.0001;
    if (isOnFloor) return true;

    // Calculate placement boundaries in world units
    const placementMinX = position[0] - (thisWidth * cellSize) / 2;
    const placementMaxX = position[0] + (thisWidth * cellSize) / 2;
    const placementMinZ = position[2] - (thisDepth * cellSize) / 2;
    const placementMaxZ = position[2] + (thisDepth * cellSize) / 2;

    // Create grid of support points to check
    const SUPPORT_POINTS = 4; // Number of support points along each axis
    const supportPoints = [];

    // Generate a grid of points to check for support (at least one must be supported)
    for (let i = 0; i <= SUPPORT_POINTS; i++) {
      for (let j = 0; j <= SUPPORT_POINTS; j++) {
        const x =
          placementMinX +
          (placementMaxX - placementMinX) * (i / SUPPORT_POINTS);
        const z =
          placementMinZ +
          (placementMaxZ - placementMinZ) * (j / SUPPORT_POINTS);
        supportPoints.push({ x, z });
      }
    }

    // Check if any of the support points have a model below them
    const hasSufficientSupport = supportPoints.some((point) => {
      return roomModels.some((model) => {
        // Get the top Y coordinate of the model
        const supportModelHeight = model.gridDimensions?.height || 1;
        const modelTop =
          model.position[1] + (supportModelHeight * cellSize) / 2;

        // Check if this model is directly below our placement position with small tolerance
        const isBelow = Math.abs(modelTop - modelBottom) < 0.0001;
        if (!isBelow) return false;

        // Get dimensions of supporting model
        const modelWidth =
          model.rotation[1] % Math.PI === 0
            ? model.gridDimensions.width
            : model.gridDimensions.depth;
        const modelDepth =
          model.rotation[1] % Math.PI === 0
            ? model.gridDimensions.depth
            : model.gridDimensions.width;

        // Calculate model boundaries in world units
        const modelMinX = model.position[0] - (modelWidth * cellSize) / 2;
        const modelMaxX = model.position[0] + (modelWidth * cellSize) / 2;
        const modelMinZ = model.position[2] - (modelDepth * cellSize) / 2;
        const modelMaxZ = model.position[2] + (modelDepth * cellSize) / 2;

        // Check if this support point is over the supporting model
        return (
          point.x >= modelMinX &&
          point.x <= modelMaxX &&
          point.z >= modelMinZ &&
          point.z <= modelMaxZ
        );
      });
    });

    return hasSufficientSupport;
  };

  // Handle model placement on click
  const handlePlaceModel = (e) => {
    if (e) e.stopPropagation();

    // console.log("Attempting to place model:", {
    //   placementPosition,
    //   placementRotation,
    //   isValidPlacement,
    //   selectedModel: selectedModel?.id,
    //   currentRoom: currentRoom?.id,
    // });

    if (
      !isPlacementMode ||
      !selectedModel ||
      !placementPosition ||
      !isValidPlacement
    ) {
      // console.warn("Invalid placement conditions", {
      //   isPlacementMode,
      //   selectedModel: !!selectedModel,
      //   placementPosition: !!placementPosition,
      //   isValidPlacement,
      // });
      return;
    }

    // Only add model if we're in a room
    if (currentRoom) {
      // Add the model at the placement position
      addModel(selectedModel, placementPosition, placementRotation);
      // console.log("Model placed in room:", currentRoom.id);
    } else {
      // Provide feedback that model can't be placed without a room
      // console.warn("Cannot place model: No room detected");
    }

    // If not in continuous placement mode, exit placement mode
    if (!selectedModel.continuousPlacement) {
      setIsPlacementMode(false);
      setSelectedModel(null);
    }
  };

  // Show placement preview
  const renderPlacementPreview = () => {
    if (!isPlacementMode || !selectedModel || !placementPosition) {
      return null;
    }

    // Calculate world dimensions based on grid dimensions
    const worldWidth = selectedModel.gridDimensions.width * cellSize;
    const worldHeight = selectedModel.gridDimensions.height * cellSize;
    const worldDepth = selectedModel.gridDimensions.depth * cellSize;

    return (
      <>
        {/* Preview box */}
        <mesh
          position={placementPosition}
          rotation={placementRotation}
          onClick={handlePlaceModel}
          ref={indicatorRef}
        >
          <boxGeometry args={[worldWidth, worldHeight, worldDepth]} />
          <meshStandardMaterial
            color={isValidPlacement ? "#00ff00" : "#ff0000"}
            transparent={true}
            opacity={0.6}
            emissive={isValidPlacement ? "#00aa00" : "#aa0000"}
            emissiveIntensity={0.5}
          />
        </mesh>
      </>
    );
  };

  return <>{renderPlacementPreview()}</>;
}

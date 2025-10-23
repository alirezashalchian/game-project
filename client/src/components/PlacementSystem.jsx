import React, { useRef, useState, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { useRoom } from "./RoomContext";
import { useCharacter } from "./CharacterContext";
import {
  getSurfaceUpVector,
  getSurfaceVectors,
  getSurfaceReferencePoint,
} from "../utils/surfaceUtils";
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

  // Get current surface information from character context
  const { currentFloorSurface } = useCharacter();

  // Setting initial position for placement preview
  const [placementPosition, setPlacementPosition] = useState(null);
  const [placementRotation, setPlacementRotation] = useState([0, 0, 0]);
  const [isValidPlacement, setIsValidPlacement] = useState(true);
  const indicatorRef = useRef();

  // Define grid cell size from room config
  const cellSize = roomConfig.cellSize;

  // Calculate surface reference height based on current room and surface
  const getSurfaceHeight = () => {
    if (!currentRoom) {
      return 0;
    }

    try {
      // Get the surface reference point (center of the surface)
      const surfacePoint = getSurfaceReferencePoint(
        currentRoom,
        currentFloorSurface
      );

      // For surface-aware placement, we need the distance from world origin
      // along the surface normal direction
      const surfaceNormal = getSurfaceUpVector(currentFloorSurface);

      // Calculate the surface plane distance (used for plane intersection)
      const distance = -surfaceNormal.dot(surfacePoint);
      return distance;
    } catch (error) {
      console.error("Error in getSurfaceHeight:", error);
      return 0;
    }
  };

  // Handle rotation with R key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "r" && selectedModel?.rotatable && isPlacementMode) {
        setPlacementRotation((prev) => {
          const newRotation = [
            prev[0],
            prev[1] + Math.PI / 2, // Rotate 90 degrees on Y axis
            prev[2],
          ];
          return newRotation;
        });
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

    try {
      // Cast ray from mouse position
      raycaster.setFromCamera(pointer, camera);

      // Get models in the current room for collision detection
      const currentRoomModels = currentRoom ? getModelsInCurrentRoom() : [];

      // Get surface information for current surface
      const surfaceNormal = getSurfaceUpVector(currentFloorSurface);
      const surfaceDistance = getSurfaceHeight();

      // Create surface plane (with fallback for safety)
      let surfacePlane;
      if (!surfaceNormal || isNaN(surfaceDistance)) {
        // Fallback to traditional floor if surface calculations somehow fail
        const FLOOR_HEIGHT = currentRoom
          ? currentRoom.position[1] - roomConfig.innerSize / 2
          : 0;
        surfacePlane = new THREE.Plane(
          new THREE.Vector3(0, 1, 0),
          -FLOOR_HEIGHT
        );
      } else {
        surfacePlane = new THREE.Plane(surfaceNormal, surfaceDistance);
      }

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

        const intersection = raycaster.ray.intersectBox(
          box,
          new THREE.Vector3()
        );
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
        // No block hit, fall back to surface plane
        const planeIntersection = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(surfacePlane, planeIntersection)) {
          placementPoint = planeIntersection;
          // console.log("Ray hit surface plane at:", planeIntersection);
        } else {
          // If ray doesn't hit the surface plane, use camera forward vector to
          // project a point in front of the camera onto the surface
          // console.log("Ray missed surface plane, using camera forward");

          // Get camera direction
          const cameraDirection = new THREE.Vector3(0, 0, -1);
          cameraDirection.applyQuaternion(camera.quaternion);

          // Create a point 5 units in front of camera
          const forwardPoint = new THREE.Vector3();
          forwardPoint.copy(camera.position);
          forwardPoint.addScaledVector(cameraDirection, 5);

          // Project this point onto the surface plane
          placementPoint = new THREE.Vector3();
          surfacePlane.projectPoint(forwardPoint, placementPoint);
        }
      }

      if (placementPoint) {
        // Check if we should use surface-aware or fallback logic
        const useSurfaceFallback = !surfaceNormal || isNaN(surfaceDistance);

        if (useSurfaceFallback) {
          // Using fallback grid snapping (traditional floor-based)
          // FALLBACK: Use traditional floor-based grid snapping
          const halfCell = cellSize / 2;

          // Check if it's a medium scale model (2x2 grid)
          const isMediumScale =
            selectedModel.gridDimensions?.width === 2 &&
            selectedModel.gridDimensions?.height === 2 &&
            selectedModel.gridDimensions?.depth === 2;

          // Apply special offset for medium scale models
          let offsetX = 0;
          let offsetZ = 0;

          if (isMediumScale) {
            const gridX = Math.floor(placementPoint.x / cellSize);
            const gridZ = Math.floor(placementPoint.z / cellSize);
            const fracX = placementPoint.x / cellSize - gridX;
            const fracZ = placementPoint.z / cellSize - gridZ;
            offsetX = fracX < 0.5 ? -halfCell : halfCell;
            offsetZ = fracZ < 0.5 ? -halfCell : halfCell;
          }

          // Apply normal snapping
          const snappedX =
            Math.floor(placementPoint.x / cellSize) * cellSize +
            halfCell +
            (isMediumScale ? offsetX : 0);

          const snappedZ =
            Math.floor(placementPoint.z / cellSize) * cellSize +
            halfCell +
            (isMediumScale ? offsetZ : 0);

          // Calculate Y position (traditional floor-based)
          let snappedY;
          const FLOOR_HEIGHT = currentRoom
            ? currentRoom.position[1] - roomConfig.innerSize / 2
            : 0;

          if (blockIntersections.length > 0) {
            const hit = blockIntersections[0];
            const hitModelHeight = hit.model.gridDimensions?.height || 1;
            const topOfHitModel =
              hit.model.position[1] + (hitModelHeight * cellSize) / 2;
            const newModelHeight = selectedModel.gridDimensions?.height || 1;
            snappedY = topOfHitModel + (newModelHeight * cellSize) / 2;
          } else {
            const modelHeight = selectedModel.gridDimensions?.height || 1;
            snappedY = FLOOR_HEIGHT + (modelHeight * cellSize) / 2;
          }

          setPlacementPosition([snappedX, snappedY, snappedZ]);

          // Use simple room boundary check for fallback
          if (currentRoom) {
            const isWithinCurrentRoom = checkIsWithinRoom(
              [snappedX, snappedY, snappedZ],
              currentRoom
            );
            const hasCollisions = checkForCollisions(
              [snappedX, snappedY, snappedZ],
              placementRotation,
              selectedModel.gridDimensions,
              currentRoomModels
            );

            // Simple floor support check
            const isSupported =
              snappedY >= FLOOR_HEIGHT || blockIntersections.length > 0;

            setIsValidPlacement(
              isWithinCurrentRoom && !hasCollisions && isSupported
            );
          } else {
            setIsValidPlacement(true);
          }
        } else {
          // Using surface-aware grid snapping
          // Surface-aware grid snapping
          const halfCell = cellSize / 2;

          // Get surface coordinate system
          const { forward, right } = getSurfaceVectors(currentFloorSurface, 0);
          const surfacePoint = getSurfaceReferencePoint(
            currentRoom,
            currentFloorSurface
          );

          // Convert placement point to surface-relative coordinates
          const offset = placementPoint.clone().sub(surfacePoint);
          const surfaceX = offset.dot(right);
          const surfaceZ = offset.dot(forward);

          // Check if it's a medium scale model (2x2 grid)
          const isMediumScale =
            selectedModel.gridDimensions?.width === 2 &&
            selectedModel.gridDimensions?.height === 2 &&
            selectedModel.gridDimensions?.depth === 2;

          // Apply special offset for medium scale models to align with walls
          let offsetSurfaceX = 0;
          let offsetSurfaceZ = 0;

          if (isMediumScale) {
            // Calculate which quadrant of the grid cell the pointer is in
            const gridX = Math.floor(surfaceX / cellSize);
            const gridZ = Math.floor(surfaceZ / cellSize);

            // Calculate the fractional position within the grid cell
            const fracX = surfaceX / cellSize - gridX;
            const fracZ = surfaceZ / cellSize - gridZ;

            // Adjust the offset based on which side of the grid cell center we're on
            offsetSurfaceX = fracX < 0.5 ? -halfCell : halfCell;
            offsetSurfaceZ = fracZ < 0.5 ? -halfCell : halfCell;
          }

          // Apply snapping in surface coordinates
          const snappedSurfaceX =
            Math.floor(surfaceX / cellSize) * cellSize +
            halfCell +
            (isMediumScale ? offsetSurfaceX : 0);

          const snappedSurfaceZ =
            Math.floor(surfaceZ / cellSize) * cellSize +
            halfCell +
            (isMediumScale ? offsetSurfaceZ : 0);

          // Convert back to world coordinates
          const snappedSurfacePosition = surfacePoint
            .clone()
            .addScaledVector(right, snappedSurfaceX)
            .addScaledVector(forward, snappedSurfaceZ);

          // Calculate surface-relative height offset
          let surfaceHeightOffset;
          if (blockIntersections.length > 0) {
            // Placing on top of another block - calculate distance from surface
            const hit = blockIntersections[0];
            const hitModelHeight = hit.model.gridDimensions?.height || 1;

            // Calculate how far the hit model extends from the surface
            const hitModelCenter = new THREE.Vector3(...hit.model.position);
            const distanceFromSurface = hitModelCenter
              .clone()
              .sub(surfacePoint)
              .dot(surfaceNormal);
            const hitModelSurfaceOffset =
              distanceFromSurface + (hitModelHeight * cellSize) / 2;

            // Place new model on top of hit model
            const newModelHeight = selectedModel.gridDimensions?.height || 1;
            surfaceHeightOffset =
              hitModelSurfaceOffset + (newModelHeight * cellSize) / 2;
          } else {
            // Placing directly on surface
            const modelHeight = selectedModel.gridDimensions?.height || 1;
            // Offset from surface by half model height in surface normal direction
            surfaceHeightOffset = (modelHeight * cellSize) / 2;
          }

          // Calculate final world position
          const finalPosition = snappedSurfacePosition
            .clone()
            .addScaledVector(surfaceNormal, surfaceHeightOffset);

          setPlacementPosition([
            finalPosition.x,
            finalPosition.y,
            finalPosition.z,
          ]);

          if (currentRoom) {
            // Check if the position is within the current room
            const isWithinCurrentRoom = checkIsWithinRoom(
              [finalPosition.x, finalPosition.y, finalPosition.z],
              currentRoom
            );

            // Check for collisions with other objects
            const hasCollisions = checkForCollisions(
              [finalPosition.x, finalPosition.y, finalPosition.z],
              placementRotation,
              selectedModel.gridDimensions,
              currentRoomModels
            );

            // Check if placement is supported from below
            const isSupported = checkIsSupported(
              [finalPosition.x, finalPosition.y, finalPosition.z],
              placementRotation,
              selectedModel.gridDimensions,
              currentRoomModels,
              surfacePoint,
              surfaceNormal
            );

            // Placement is valid if it's within room, has no collisions, and is supported
            setIsValidPlacement(
              isWithinCurrentRoom && !hasCollisions && isSupported
            );
          } else {
            // If no room is set yet, just allow placement anywhere
            setIsValidPlacement(true);
          }
        } // End of surface-aware logic
      } // End of if (placementPoint)
    } catch (error) {
      console.error("Error in placement system:", error);
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

  // Check if the model is supported from the surface or other models
  const checkIsSupported = (
    position,
    rotation,
    size,
    roomModels,
    surfacePoint,
    surfaceNormal
  ) => {
    if (!size) return true;

    // Get model dimensions based on rotation
    const thisWidth = rotation[1] % Math.PI === 0 ? size.width : size.depth;
    const thisDepth = rotation[1] % Math.PI === 0 ? size.depth : size.width;
    const thisHeight = size.height || 1;

    // Calculate model position and distance from surface
    const modelPosition = new THREE.Vector3(...position);
    const modelBackSurface = modelPosition
      .clone()
      .addScaledVector(surfaceNormal, -(thisHeight * cellSize) / 2);

    // Check if resting directly on the surface
    const distanceToSurface = Math.abs(
      surfaceNormal.dot(modelBackSurface.clone().sub(surfacePoint))
    );
    const isOnSurface = distanceToSurface < 0.0001;
    if (isOnSurface) return true;

    // Get surface coordinate system for calculating support boundaries
    const { forward, right } = getSurfaceVectors(currentFloorSurface, 0);

    // Calculate model boundaries in surface coordinates
    const modelOffset = modelPosition.clone().sub(surfacePoint);
    const centerSurfaceX = modelOffset.dot(right);
    const centerSurfaceZ = modelOffset.dot(forward);

    const halfSurfaceWidth = (thisWidth * cellSize) / 2;
    const halfSurfaceDepth = (thisDepth * cellSize) / 2;

    // Create grid of support points in surface coordinates
    const SUPPORT_POINTS = 4;
    const supportPoints = [];

    for (let i = 0; i <= SUPPORT_POINTS; i++) {
      for (let j = 0; j <= SUPPORT_POINTS; j++) {
        const surfaceX =
          centerSurfaceX + (i / SUPPORT_POINTS - 0.5) * 2 * halfSurfaceWidth;
        const surfaceZ =
          centerSurfaceZ + (j / SUPPORT_POINTS - 0.5) * 2 * halfSurfaceDepth;

        // Convert back to world coordinates
        const worldPoint = surfacePoint
          .clone()
          .addScaledVector(right, surfaceX)
          .addScaledVector(forward, surfaceZ);

        supportPoints.push(worldPoint);
      }
    }

    // Check if any support point has a model supporting it
    const hasSufficientSupport = supportPoints.some((supportPoint) => {
      return roomModels.some((model) => {
        const supportModelHeight = model.gridDimensions?.height || 1;
        const supportModelPosition = new THREE.Vector3(...model.position);

        // Calculate the "top" of the supporting model in surface normal direction
        const supportModelTop = supportModelPosition
          .clone()
          .addScaledVector(surfaceNormal, (supportModelHeight * cellSize) / 2);

        // Check if supporting model top is at the same level as our model back
        const heightDifference = Math.abs(
          surfaceNormal.dot(supportModelTop.clone().sub(modelBackSurface))
        );
        const isSameLevel = heightDifference < 0.0001;
        if (!isSameLevel) return false;

        // Check if support point is within supporting model boundaries
        const supportModelWidth =
          model.rotation[1] % Math.PI === 0
            ? model.gridDimensions.width
            : model.gridDimensions.depth;
        const supportModelDepth =
          model.rotation[1] % Math.PI === 0
            ? model.gridDimensions.depth
            : model.gridDimensions.width;

        // Convert support point to surface coordinates relative to supporting model
        const supportModelOffset = supportModelPosition
          .clone()
          .sub(surfacePoint);
        const supportModelSurfaceX = supportModelOffset.dot(right);
        const supportModelSurfaceZ = supportModelOffset.dot(forward);

        const supportPointOffset = supportPoint.clone().sub(surfacePoint);
        const supportPointSurfaceX = supportPointOffset.dot(right);
        const supportPointSurfaceZ = supportPointOffset.dot(forward);

        const supportHalfWidth = (supportModelWidth * cellSize) / 2;
        const supportHalfDepth = (supportModelDepth * cellSize) / 2;

        return (
          supportPointSurfaceX >= supportModelSurfaceX - supportHalfWidth &&
          supportPointSurfaceX <= supportModelSurfaceX + supportHalfWidth &&
          supportPointSurfaceZ >= supportModelSurfaceZ - supportHalfDepth &&
          supportPointSurfaceZ <= supportModelSurfaceZ + supportHalfDepth
        );
      });
    });

    return hasSufficientSupport;
  };

  // Handle model placement on click
  const handlePlaceModel = (e) => {
    if (e) e.stopPropagation();

    if (
      !isPlacementMode ||
      !selectedModel ||
      !placementPosition ||
      !isValidPlacement
    ) {
      return;
    }

    // Only add model if we're in a room
    if (currentRoom) {
      // DEBUG: Log placement rotation before adding model

      // Add the model at the placement position
      addModel(selectedModel, placementPosition, placementRotation);
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

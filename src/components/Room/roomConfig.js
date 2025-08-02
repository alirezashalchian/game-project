import { getCoordsFromRoomId, isPhantomRoom } from "../../utils/roomUtils";

export const roomConfig = {
  innerSize: 15, // The inner space of the room (15x15x15)
  wallThickness: 0.5, // Thickness of the walls
  doorSize: 3, // Size of the door opening in each wall (reduced to half)
  wallColors: {
    front: "#607D8B", // Blue-gray
    back: "#607D8B",
    right: "#607D8B",
    left: "#607D8B",
    top: "#90A4AE", // Lighter blue-gray for ceiling
    bottom: "#455A64", // Darker blue-gray for floor
  },
  cellSize: 0.5, // Size of each grid cell for placement (renamed from gridCellSize)
};

// Calculate the outer size of the room (including walls)
roomConfig.outerSize = roomConfig.innerSize + roomConfig.wallThickness * 2;

// Calculate the distance between the centers of adjacent rooms
roomConfig.roomDistance = roomConfig.innerSize + roomConfig.wallThickness * 2;

/**
 * Check if a wall should have a door based on the adjacent room
 */
export const shouldWallHaveDoor = (roomId, wallType) => {
  // Get current room coordinates
  const coords = getCoordsFromRoomId(roomId);
  const [x, y, z] = coords;

  // Calculate adjacent room coordinates based on wall type
  let adjacentCoords;
  switch (wallType) {
    case "front": adjacentCoords = [x, y, z + 1]; break;
    case "back": adjacentCoords = [x, y, z - 1]; break;
    case "right": adjacentCoords = [x + 1, y, z]; break;
    case "left": adjacentCoords = [x - 1, y, z]; break;
    case "top": adjacentCoords = [x, y + 1, z]; break;
    case "bottom": adjacentCoords = [x, y - 1, z]; break;
    default: return false;
  }

  // No door if adjacent room is phantom (outside the complex)
  return !isPhantomRoom(adjacentCoords);
};

// Function to generate wall configurations for a room
export const generateWallConfigs = (roomId) => {
  const halfInnerSize = roomConfig.innerSize / 2;
  const wallOffset = halfInnerSize + roomConfig.wallThickness / 2;

  return [
    {
      position: [0, 0, wallOffset],
      rotation: [0, 0, 0],
      type: "front",
      hasDoor: shouldWallHaveDoor(roomId, "front"),
    },
    {
      position: [0, 0, -wallOffset],
      rotation: [0, Math.PI, 0],
      type: "back",
      hasDoor: shouldWallHaveDoor(roomId, "back"),
    },
    {
      position: [wallOffset, 0, 0],
      rotation: [0, Math.PI / 2, 0],
      type: "right",
      hasDoor: shouldWallHaveDoor(roomId, "right"),
    },
    {
      position: [-wallOffset, 0, 0],
      rotation: [0, -Math.PI / 2, 0],
      type: "left",
      hasDoor: shouldWallHaveDoor(roomId, "left"),
    },
    {
      position: [0, wallOffset, 0],
      rotation: [Math.PI / 2, 0, 0],
      type: "top",
      hasDoor: shouldWallHaveDoor(roomId, "top"),
    },
    {
      position: [0, -wallOffset, 0],
      rotation: [-Math.PI / 2, 0, 0],
      type: "bottom",
      hasDoor: shouldWallHaveDoor(roomId, "bottom"),
    },
  ];
};

// Directions for connecting rooms - using camelCase
export const directions = {
  front: [0, 0, 1],
  back: [0, 0, -1],
  right: [1, 0, 0],
  left: [-1, 0, 0],
  top: [0, 1, 0],
  bottom: [0, -1, 0],
};

// Calculate room position based on a direction from a center point
export const calculateRoomPosition = (centerRoom, direction) => {
  return [
    centerRoom[0] + direction[0] * roomConfig.roomDistance,
    centerRoom[1] + direction[1] * roomConfig.roomDistance,
    centerRoom[2] + direction[2] * roomConfig.roomDistance,
  ];
};

// Calculate room boundaries from center position
export const calculateRoomBoundaries = (position) => {
  const halfInnerSize = roomConfig.innerSize / 2;

  return {
    minX: position[0] - halfInnerSize,
    maxX: position[0] + halfInnerSize,
    minY: position[1] - halfInnerSize,
    maxY: position[1] + halfInnerSize,
    minZ: position[2] - halfInnerSize,
    maxZ: position[2] + halfInnerSize,
  };
};
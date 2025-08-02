/**
 * Utility functions for room system
 */
import { roomConfig } from "../components/Room/roomConfig";

// Grid size (9x9x9)
const gridSize = 9;

// Cache for room data
const roomCache = {
  positions: {},   // Maps "x-y-z" -> [x, y, z] world position
  boundaries: {},  // Maps "x-y-z" -> {minX, maxX, minY, maxY, minZ, maxZ}
  adjacentRooms: {} // Maps "x-y-z" -> array of adjacent room IDs
};

/**
 * Initialize room data for the entire complex
 */
export const initializeRoomData = () => {
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      for (let z = 0; z < gridSize; z++) {
        const roomId = getRoomId([x, y, z]);
        
        // Calculate room position
        roomCache.positions[roomId] = calculateRoomPosition([x, y, z]);
        
        // Calculate room boundaries
        roomCache.boundaries[roomId] = calculateRoomBoundaries(roomCache.positions[roomId]);
        
        // Calculate adjacent rooms
        roomCache.adjacentRooms[roomId] = getAdjacentRoomIds([x, y, z]);
      }
    }
  }
  console.log(`Room data initialized for all ${gridSize * gridSize * gridSize} rooms`);
};

/**
 * Calculate world position of a room from its grid coordinates
 */
export const calculateRoomPosition = (coords) => {
  const [x, y, z] = coords;
  const roomSize = roomConfig.innerSize + roomConfig.wallThickness * 2;
  
  // Center the complex around origin
  const complexHalfSize = (roomSize * gridSize) / 2;
  
  return [
    x * roomSize - complexHalfSize + roomSize/2,
    y * roomSize - complexHalfSize + roomSize/2,
    z * roomSize - complexHalfSize + roomSize/2
  ];
};

/**
 * Calculate room boundaries from its center position
 */
export const calculateRoomBoundaries = (position) => {
  const halfSize = roomConfig.innerSize / 2;
  
  return {
    minX: position[0] - halfSize,
    maxX: position[0] + halfSize,
    minY: position[1] - halfSize,
    maxY: position[1] + halfSize,
    minZ: position[2] - halfSize,
    maxZ: position[2] + halfSize
  };
};

/**
 * Generate a unique room ID from coordinates
 */
export const getRoomId = (coords) => {
  return `room-${coords[0]}-${coords[1]}-${coords[2]}`;
};

/**
 * Check if room coordinates are outside the valid grid (phantom room)
 */
export const isPhantomRoom = (coords) => {
  const [x, y, z] = coords;
  return x < 0 || x >= gridSize || y < 0 || y >= gridSize || z < 0 || z >= gridSize;
};

/**
 * Get coordinates from a room ID (works for phantom rooms too)
 */
export const getCoordsFromRoomId = (roomId) => {
  const parts = roomId.split('-');
  return [parseInt(parts[1]), parseInt(parts[2]), parseInt(parts[3])];
};

/**
 * Get IDs of adjacent rooms (now includes phantom rooms for consistency)
 */
export const getAdjacentRoomIds = (coords) => {
  const [x, y, z] = coords;
  const adjacent = [];
  
  // Add current room
  adjacent.push(getRoomId([x, y, z]));
  
  // Add all 6 adjacent rooms (including phantom ones outside the grid)
  adjacent.push(getRoomId([x-1, y, z])); // Left
  adjacent.push(getRoomId([x+1, y, z])); // Right
  adjacent.push(getRoomId([x, y-1, z])); // Below
  adjacent.push(getRoomId([x, y+1, z])); // Above
  adjacent.push(getRoomId([x, y, z-1])); // Back
  adjacent.push(getRoomId([x, y, z+1])); // Front
  
  return adjacent;
};

/**
 * Get only real (non-phantom) adjacent room IDs
 */
export const getRealAdjacentRoomIds = (coords) => {
  const [x, y, z] = coords;
  const adjacent = [];
  
  // Add current room (if it's real)
  if (!isPhantomRoom([x, y, z])) {
    adjacent.push(getRoomId([x, y, z]));
  }
  
  // Add adjacent rooms (with boundary checks for real rooms only)
  if (x > 0) adjacent.push(getRoomId([x-1, y, z]));
  if (x < gridSize-1) adjacent.push(getRoomId([x+1, y, z]));
  if (y > 0) adjacent.push(getRoomId([x, y-1, z]));
  if (y < gridSize-1) adjacent.push(getRoomId([x, y+1, z]));
  if (z > 0) adjacent.push(getRoomId([x, y, z-1]));
  if (z < gridSize-1) adjacent.push(getRoomId([x, y, z+1]));
  
  return adjacent;
};

/**
 * Find which room contains a given point
 */
export const findRoomContainingPoint = (point, allRooms = null) => {
  // If we have pre-calculated room data, use it
  if (Object.keys(roomCache.boundaries).length > 0) {
    for (const roomId in roomCache.boundaries) {
      const boundaries = roomCache.boundaries[roomId];
      
      if (
        point.x >= boundaries.minX && point.x <= boundaries.maxX &&
        point.y >= boundaries.minY && point.y <= boundaries.maxY &&
        point.z >= boundaries.minZ && point.z <= boundaries.maxZ
      ) {
        // Create a room object that matches the format used elsewhere
        return {
          id: roomId,
          position: roomCache.positions[roomId],
          boundaries: boundaries,
          adjacentRooms: roomCache.adjacentRooms[roomId],
          innerSize: roomConfig.innerSize,
          outerSize: roomConfig.outerSize
        };
      }
    }
    return null;
  }
  
  // Fallback to using the provided rooms
  if (!allRooms || !Array.isArray(allRooms)) return null;
  
  return allRooms.find(room => isPointInRoom(point, room)) || null;
};

/**
 * Checks if a point is within a room's boundaries
 */
export const isPointInRoom = (point, room) => {
  if (!room || !room.boundaries) return false;

  const { boundaries } = room;
  return (
    point.x >= boundaries.minX &&
    point.x <= boundaries.maxX &&
    point.y >= boundaries.minY &&
    point.y <= boundaries.maxY &&
    point.z >= boundaries.minZ &&
    point.z <= boundaries.maxZ
  );
};

/**
 * Get IDs of rooms that should be rendered based on current room
 */
export const getRoomsToRender = (currentRoomId) => {
  if (!roomCache.adjacentRooms[currentRoomId]) {
    // Fallback if adjacency data not available
    const coords = getCoordsFromRoomId(currentRoomId);
    return getAdjacentRoomIds(coords);
  }
  
  return roomCache.adjacentRooms[currentRoomId];
};

/**
 * Convert a Three.js Vector3 to a simple object with x, y, z properties
 */
export const positionArrayToObject = (position) => {
  return {
    x: position[0],
    y: position[1],
    z: position[2],
  };
};

/**
 * Calculates the distance between two 3D points
 * @param {Array} point1 - First point [x, y, z]
 * @param {Array} point2 - Second point [x, y, z]
 * @returns {number} - Distance between the points
 */
export const calculateDistance = (point1, point2) => {
  const dx = point1[0] - point2[0];
  const dy = point1[1] - point2[1];
  const dz = point1[2] - point2[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}; 
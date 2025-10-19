import React, { useRef, useEffect, useState, useMemo } from "react";
import { Room } from "./Room";
import { useRoom } from "../RoomContext";
import {
  getRoomId,
  initializeRoomData,
  getRoomsToRender,
  calculateRoomPosition,
  getCoordsFromRoomId,
  isPhantomRoom,
} from "../../utils/roomUtils";

export const DynamicRoomManager = () => {
  const { currentRoom, registerRoom } = useRoom();
  const [roomsReady, setRoomsReady] = useState(false);
  const [activeRooms, setActiveRooms] = useState([]);
  const roomRefs = useRef({});

  // Keep track of previously rendered rooms to avoid unnecessary re-renders
  const prevRoomsRef = useRef(new Set());

  // Default starting room (center of the complex)
  const defaultRoomCoords = [4, 4, 4];
  const defaultRoomId = getRoomId(defaultRoomCoords);

  // Initialize room data when component mounts
  useEffect(() => {
    initializeRoomData();

    // Set initial active rooms based on default room
    const initialRoomIds = getRoomsToRender(defaultRoomId);

    // Filter out phantom rooms for rendering, but keep them in calculations
    const realRoomIds = initialRoomIds.filter((id) => {
      const coords = getCoordsFromRoomId(id);
      return !isPhantomRoom(coords);
    });

    const initialRooms = realRoomIds.map((id) => {
      const coords = getCoordsFromRoomId(id);
      return {
        id: id,
        position: calculateRoomPosition(coords),
        coords: coords,
      };
    });

    setActiveRooms(initialRooms);
    prevRoomsRef.current = new Set(realRoomIds);
  }, [defaultRoomId]);

  // Create refs for each active room - memoized to avoid recreation
  const ensureRoomRefs = useMemo(() => {
    activeRooms.forEach((room) => {
      if (!roomRefs.current[room.id]) {
        roomRefs.current[room.id] = React.createRef();
      }
    });
    return roomRefs.current;
  }, [activeRooms]);

  // Update active rooms whenever the current room changes
  useEffect(() => {
    if (!currentRoom) return;

    // Get ALL rooms to render (including phantom ones for consistency)
    const allRoomIdsToRender = getRoomsToRender(currentRoom.id);

    // Filter out phantom rooms for actual rendering
    const realRoomIdsToRender = allRoomIdsToRender.filter((id) => {
      const coords = getCoordsFromRoomId(id);
      return !isPhantomRoom(coords);
    });

    const newRoomIdsSet = new Set(realRoomIdsToRender);
    const prevRoomIdsSet = prevRoomsRef.current;

    // Check for actual changes - if sets are identical, skip update
    if (
      realRoomIdsToRender.length === prevRoomIdsSet.size &&
      realRoomIdsToRender.every((id) => prevRoomIdsSet.has(id))
    ) {
      return;
    }

    // Calculate new rooms with position data (only real rooms)
    const roomsToRender = realRoomIdsToRender.map((id) => {
      const coords = getCoordsFromRoomId(id);
      return {
        id: id,
        position: calculateRoomPosition(coords),
        coords: coords,
      };
    });

    // Update state and track rendered rooms
    setActiveRooms(roomsToRender);
    prevRoomsRef.current = newRoomIdsSet;
  }, [currentRoom]);

  // Set rooms ready flag when component mounts
  useEffect(() => {
    const timerId = setTimeout(() => {
      setRoomsReady(true);
    }, 500);

    return () => clearTimeout(timerId);
  }, []);

  // Register rooms with context when ready
  useEffect(() => {
    if (!roomsReady) return;

    // Register all active rooms
    Object.values(ensureRoomRefs).forEach((ref) => {
      if (ref.current) {
        registerRoom(ref);
      }
    });
  }, [roomsReady, registerRoom, activeRooms, ensureRoomRefs]);

  const activeRoomId = useMemo(
    () => (currentRoom ? currentRoom.id : defaultRoomId),
    [currentRoom, defaultRoomId]
  );

  return (
    <>
      {activeRooms.map((room) => (
        <Room
          key={room.id}
          roomId={room.id}
          position={room.position}
          roomRef={roomRefs.current[room.id]}
          isActive={activeRoomId === room.id}
        />
      ))}
    </>
  );
};

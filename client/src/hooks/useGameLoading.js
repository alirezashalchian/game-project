import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useColyseus } from '../context/ColyseusContext';

/**
 * Hook for managing game loading state
 * @param {Object} options - Loading options
 * @param {number[]} options.targetRoomCoords - Target room coordinates [x, y, z] to connect to
 */
export function useGameLoading({ targetRoomCoords = [4, 4, 4] } = {}) {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState('Initializing...');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingErrors, setLoadingErrors] = useState([]);
  const hasInitiatedConnection = useRef(false);
  const currentTargetRef = useRef(null);

  // Get Colyseus connection status and connectToRoom function
  const { isConnected: colyseusConnected, connectToRoom } = useColyseus();

  // Generate room ID from coordinates
  const targetRoomId = useMemo(() => {
    return `room-${targetRoomCoords[0]}-${targetRoomCoords[1]}-${targetRoomCoords[2]}`;
  }, [targetRoomCoords]);

  // Get initial room data from Convex for the target room
  const roomData = useQuery(api.rooms.getRoomData, { roomId: targetRoomId });

  // Initiate Colyseus connection during loading (to the target room)
  useEffect(() => {
    const targetKey = targetRoomCoords.join('-');
    
    // Only connect if we haven't initiated or if target changed
    if (connectToRoom && (!hasInitiatedConnection.current || currentTargetRef.current !== targetKey)) {
      hasInitiatedConnection.current = true;
      currentTargetRef.current = targetKey;
      connectToRoom(targetRoomCoords);
    }
  }, [connectToRoom, targetRoomCoords]);

  useEffect(() => {
    const checkServices = async () => {
      try {

        // Step 1: Wait for Convex data (this is the key!)
        setLoadingStage('Loading world data...');
        setLoadingProgress(20);
        
        if (roomData === undefined) {
          // Still loading from Convex
          return; // Exit and wait for next effect trigger
        }

        setLoadingProgress(60);

        // Step 2: Check Colyseus connection
        setLoadingStage('Connecting to multiplayer...');
        
        if (!colyseusConnected) {
          return; // Exit and wait for connection
        }

        setLoadingProgress(80);

        // Step 3: Everything is ready
        setLoadingStage('Finalizing...');
        setLoadingProgress(100);

        // Small delay to show completion
        await new Promise(resolve => setTimeout(resolve, 4500));
        
        setIsLoading(false);

      } catch (error) {
        setLoadingErrors(prev => [...prev, error.message]);
        // Don't set isLoading to false on error - keep trying
      }
    };

    checkServices();
  }, [roomData, colyseusConnected]); // Re-run when either changes

  return { 
    isLoading, 
    loadingProgress, 
    loadingStage,
    loadingErrors,
    hasErrors: loadingErrors.length > 0,
    roomData // Return the loaded room data
  };
}
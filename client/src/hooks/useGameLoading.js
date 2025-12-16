import { useState, useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useColyseus } from '../context/ColyseusContext';

export function useGameLoading() {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState('Initializing...');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingErrors, setLoadingErrors] = useState([]);
  const hasInitiatedConnection = useRef(false);

  // Get Colyseus connection status and connectToRoom function
  const { isConnected: colyseusConnected, connectToRoom } = useColyseus();

  // Get initial room data from Convex - this is what we're actually waiting for
  const roomData = useQuery(api.rooms.getRoomData, { roomId: "room-4-4-4" });

  // Initiate Colyseus connection during loading (to the default room)
  useEffect(() => {
    if (!hasInitiatedConnection.current && connectToRoom) {
      hasInitiatedConnection.current = true;
      // Connect to the default starting room [4, 4, 4]
      connectToRoom([4, 4, 4]);
    }
  }, [connectToRoom]);

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
import React, { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { ColyseusProvider } from "./context/ColyseusContext";
import { ConvexWrapper } from "./context/ConvexContext";
import { WalletProvider } from "./context/WalletContext";
import HuddleProvider from "./context/HuddleProvider";
import HuddleAudioProvider from "./context/HuddleAudioContext";
import LandingPage from "./components/LandingPage";
import GamePage from "./components/GamePage";
import BundlesPage from "./components/BundlesPage";
import CharacterSelectOverlay from "./components/CharacterSelectOverlay";

function AppContent() {
  const navigate = useNavigate();
  
  // State for wallet flow
  const [showCharacterSelect, setShowCharacterSelect] = useState(false);
  const [playerData, setPlayerData] = useState(null);
  const [pendingWalletAddress, setPendingWalletAddress] = useState(null);
  
  const getOrCreatePlayer = useMutation(api.players.getOrCreatePlayer);

  // Handle guest entry - navigate to game with isGuest flag
  const handleGuestEntry = () => {
    navigate("/game", { state: { isGuest: true } });
  };

  // Handle wallet connected - fetch/create player and show character selection
  const handleWalletConnected = async (walletAddress) => {
    setPendingWalletAddress(walletAddress);
    
    try {
      // Get or create player in Convex
      const player = await getOrCreatePlayer({ walletAddress });
      setPlayerData(player);
      setShowCharacterSelect(true);
    } catch (e) {
      console.error("Failed to get/create player:", e);
    }
  };

  // Handle character selected - navigate to game with wallet data
  const handleCharacterSelected = (character) => {
    setShowCharacterSelect(false);
    
    // Navigate to game with wallet connection info
    navigate("/game", {
      state: {
        isGuest: false,
        walletAddress: pendingWalletAddress,
        characterId: character.id,
        characterType: character.type,
        ownedRoomId: playerData?.ownedRoomId || null,
      },
    });
    
    // Clear temporary state
    setPendingWalletAddress(null);
    setPlayerData(null);
  };

  // Close character select and stay on landing
  const handleCloseCharacterSelect = () => {
    setShowCharacterSelect(false);
    setPendingWalletAddress(null);
    setPlayerData(null);
  };

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <LandingPage
              onGuestEntry={handleGuestEntry}
              onWalletConnected={handleWalletConnected}
            />
          }
        />
        <Route path="/game" element={<GamePage />} />
        <Route path="/bundles" element={<BundlesPage />} />
      </Routes>

      {/* Character Selection Overlay - shown after wallet connection */}
      <CharacterSelectOverlay
        isOpen={showCharacterSelect}
        onClose={handleCloseCharacterSelect}
        onCharacterSelected={handleCharacterSelected}
        walletAddress={pendingWalletAddress}
        playerData={playerData}
      />
    </>
  );
}

export default function App() {
  return (
    <ConvexWrapper>
      <WalletProvider>
        <ColyseusProvider>
          <HuddleProvider>
            <HuddleAudioProvider>
              <AppContent />
            </HuddleAudioProvider>
          </HuddleProvider>
        </ColyseusProvider>
      </WalletProvider>
    </ConvexWrapper>
  );
}

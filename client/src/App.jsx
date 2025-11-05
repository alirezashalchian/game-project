import React from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { ColyseusProvider } from "./context/ColyseusContext";
import { ConvexWrapper } from "./context/ConvexContext";
import HuddleProvider from "./context/HuddleProvider";
import HuddleAudioProvider from "./context/HuddleAudioContext";
import LandingPage from "./components/LandingPage";
import GamePage from "./components/GamePage";
import BundlesPage from "./components/BundlesPage";

export default function App() {
  const navigate = useNavigate();

  const handlePlayNow = () => {
    navigate("/game");
  };

  return (
    <ConvexWrapper>
      <ColyseusProvider>
        <HuddleProvider>
          <HuddleAudioProvider>
            <Routes>
              <Route path="/" element={<LandingPage onPlayNow={handlePlayNow} />} />
              <Route path="/game" element={<GamePage />} />
              <Route path="/bundles" element={<BundlesPage />} />
            </Routes>
          </HuddleAudioProvider>
        </HuddleProvider>
      </ColyseusProvider>
    </ConvexWrapper>
  );
}

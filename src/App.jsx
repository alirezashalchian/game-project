import React from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { ColyseusProvider } from "./context/ColyseusContext";
import { ConvexWrapper } from "./context/ConvexContext";
import LandingPage from "./components/LandingPage";
import GamePage from "./components/GamePage";

export default function App() {
  const navigate = useNavigate();

  const handlePlayNow = () => {
    navigate("/game");
  };

  return (
    <ConvexWrapper>
      <ColyseusProvider>
        <Routes>
          <Route path="/" element={<LandingPage onPlayNow={handlePlayNow} />} />
          <Route path="/game" element={<GamePage />} />
        </Routes>
      </ColyseusProvider>
    </ConvexWrapper>
  );
}

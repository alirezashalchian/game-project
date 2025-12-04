import { useState, useEffect } from "react";
import Lottie from "lottie-react";
import { Progress } from "@/components/ui/progress";

const loadingMessages = [
  "LOADING THE WORLD...",
  "SPAWNING BLOCKS...",
  "GATHERING RESOURCES...",
  "BUILDING ADVENTURES...",
  "PREPARING YOUR QUEST...",
  "CHARGING MAGIC CRYSTALS...",
];

const gameTips = [
  "TIP: Use blocks creatively to build epic structures!",
  "TIP: Different characters have unique abilities!",
  "TIP: Explore every corner to find hidden treasures!",
  "TIP: Team up with friends for bigger adventures!",
  "TIP: Experiment with different building materials!",
  "TIP: Save your progress frequently during long builds!",
];

export default function GameLoadingPage({
  progress = 0,
  stage = "Loading...",
  errors = [],
  hasErrors = false,
  onComplete,
}) {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [cubeAnimation, setCubeAnimation] = useState(null);

  // Load the Lottie animation
  useEffect(() => {
    fetch("/animations/DynamicCube.json")
      .then((res) => res.json())
      .then((data) => setCubeAnimation(data))
      .catch((err) => console.error("Failed to load animation:", err));
  }, []);

  // Rotate loading messages every 2 seconds
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);
    return () => clearInterval(messageInterval);
  }, []);

  // Rotate tips every 4 seconds
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % gameTips.length);
    }, 4000);
    return () => clearInterval(tipInterval);
  }, []);

  // Smooth progress animation
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setDisplayProgress((prev) => {
        if (prev < progress) {
          return Math.min(prev + 1, progress);
        }
        return prev;
      });
    }, 50);
    return () => clearInterval(progressInterval);
  }, [progress]);

  // Auto-complete demo after reaching 100%
  useEffect(() => {
    if (displayProgress >= 100 && onComplete) {
      const timer = setTimeout(onComplete, 1000);
      return () => clearTimeout(timer);
    }
  }, [displayProgress, onComplete]);

  return (
    <div className="loading-page">
      {/* Animated background grid */}
      <div className="loading-bg-grid" />
      
      {/* Scanline effect */}
      <div className="loading-scanlines" />

      {/* Main content */}
      <div className="loading-content">
        {/* Lottie Cube Animation */}
        <div className="loading-cube-container">
          {cubeAnimation ? (
            <Lottie
              animationData={cubeAnimation}
              loop={true}
              autoplay={true}
              style={{ width: 220, height: 220 }}
            />
          ) : (
            <div className="loading-cube-placeholder" />
          )}
        </div>

        {/* Game Title */}
        <h1 className="loading-title">BLOCK QUEST</h1>
        <p className="loading-subtitle">3D ADVENTURE AWAITS</p>

        {/* Loading Stage */}
        <div className="loading-stage">
          <span className="loading-stage-text">{stage.toUpperCase()}</span>
        </div>

        {/* Loading Message */}
        <div className="loading-message-container">
          <p key={currentMessage} className="loading-message">
            {loadingMessages[currentMessage]}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="loading-progress-section">
          <div className="loading-progress-wrapper">
            <Progress
              value={displayProgress}
              className={`loading-progress-bar ${hasErrors ? "loading-progress-warning" : ""}`}
            />
            <div className="loading-progress-shine" />
          </div>
          <div className="loading-progress-text">
            <span className="loading-progress-percent">{displayProgress}%</span>
            <span className="loading-progress-label">COMPLETE</span>
            {hasErrors && <span className="loading-progress-warn-text">WITH WARNINGS</span>}
          </div>
        </div>

        {/* Error Display */}
        {hasErrors && errors.length > 0 && (
          <div className="loading-errors">
            <p className="loading-errors-title">⚠ WARNINGS:</p>
            <ul className="loading-errors-list">
              {errors.map((error, index) => (
                <li key={index}>▸ {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Gaming Tips */}
        <div className="loading-tip-card">
          <p key={currentTip} className="loading-tip-text">
            {gameTips[currentTip]}
          </p>
        </div>

        {/* Pixel loading dots */}
        <div className="loading-dots">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="loading-dot"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";

const loadingMessages = [
  "Loading the world...",
  "Spawning blocks...",
  "Gathering resources...",
  "Building adventures...",
  "Preparing your quest...",
  "Charging magic crystals...",
];

const gameTips = [
  "Tip: Use blocks creatively to build epic structures!",
  "Tip: Different characters have unique abilities!",
  "Tip: Explore every corner to find hidden treasures!",
  "Tip: Team up with friends for bigger adventures!",
  "Tip: Experiment with different building materials!",
  "Tip: Save your progress frequently during long builds!",
];

export default function GameLoadingPage({ progress = 0, onComplete }) {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);

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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 overflow-hidden relative">
      {/* Main Loading Content */}
      <div className="z-10 text-center space-y-8 max-w-md w-full">
        {/* Game Title */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground bounce-animation">
            {"Block Quest"}
          </h1>
          <p className="text-muted-foreground text-lg">
            {"3D Adventure Awaits"}
          </p>
        </div>

        {/* Loading Message */}
        <div className="h-8">
          <p
            key={currentMessage}
            className="text-xl font-semibold text-primary animate-in fade-in-0 duration-500"
          >
            {loadingMessages[currentMessage]}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-4">
          <div className="relative">
            <Progress
              value={displayProgress}
              className="h-4 bg-secondary pulse-glow rounded-full overflow-hidden"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse rounded-full" />
          </div>
          <p className="text-sm text-muted-foreground">
            {displayProgress}% Complete
          </p>
        </div>

        {/* Gaming Tips */}
        <Card className="p-4 bg-card/50 backdrop-blur-sm border-primary/20">
          <p
            key={currentTip}
            className="text-sm text-card-foreground animate-in fade-in-0 duration-700"
          >
            {gameTips[currentTip]}
          </p>
        </Card>

        {/* Fun Loading Indicator */}
        <div className="flex justify-center space-x-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

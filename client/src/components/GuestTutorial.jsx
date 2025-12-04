import { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft, User, Mic, Volume2, Trash2 } from "lucide-react";

const TUTORIAL_STEPS = [
  {
    id: "movement",
    title: "MOVEMENT",
    description: "Use these keys to move around",
  },
  {
    id: "gravity",
    title: "GRAVITY",
    description: "Press G to change gravity towards where you're facing",
  },
  {
    id: "blocks",
    title: "BUILD",
    description: "Open this to place and build with blocks",
  },
  {
    id: "roominfo",
    title: "ROOM INFO",
    description: "See which room you're in, how many blocks are placed, and clear all blocks with one click",
  },
  {
    id: "voice",
    title: "VOICE & AUDIO",
    description: "Enable Audio to hear others. Enable Mic to let them hear you.",
  },
];

export default function GuestTutorial({ onGetCharacter }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tutorialComplete, setTutorialComplete] = useState(false);

  const step = TUTORIAL_STEPS[currentStep];

  // Add tutorial step to body for CSS targeting
  useEffect(() => {
    if (!tutorialComplete) {
      document.body.setAttribute('data-tutorial-step', step.id);
    } else {
      document.body.removeAttribute('data-tutorial-step');
    }
    return () => {
      document.body.removeAttribute('data-tutorial-step');
    };
  }, [currentStep, tutorialComplete, step.id]);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setTutorialComplete(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setTutorialComplete(true);
  };

  return (
    <>
      {/* Guest Info - Simple text at top, no container */}
      <div className="tutorial-guest-text">
        <div className="tutorial-guest-label">
          <User size={14} />
          <span>You are a guest</span>
        </div>
        <button className="tutorial-get-character-btn" onClick={onGetCharacter}>
          Get your own character
        </button>
      </div>

      {/* Tutorial Overlay - Only during tutorial */}
      {!tutorialComplete && (
        <div className="tutorial-overlay">
          {/* Dark backdrop */}
          <div className="tutorial-backdrop" />

          {/* Progress Dots */}
          <div className="tutorial-progress">
            {TUTORIAL_STEPS.map((s, index) => (
              <div
                key={s.id}
                className={`tutorial-progress-dot ${index === currentStep ? 'tutorial-progress-dot--active' : ''} ${index < currentStep ? 'tutorial-progress-dot--completed' : ''}`}
              />
            ))}
          </div>

          {/* ====== STEP 1: WASD Movement ====== */}
          {step.id === "movement" && (
            <div className="tutorial-step tutorial-step--wasd">
              <div className="tutorial-wasd-container">
                <div className="tutorial-wasd-row">
                  <div className="tutorial-key">W</div>
                </div>
                <div className="tutorial-wasd-row">
                  <div className="tutorial-key">A</div>
                  <div className="tutorial-key">S</div>
                  <div className="tutorial-key">D</div>
                </div>
              </div>
              <div className="tutorial-step-content">
                <svg className="tutorial-arrow" viewBox="0 0 80 40" fill="none">
                  <path d="M70 20 L10 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <path d="M20 15 L10 20 L20 25" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="tutorial-message">
                  <span className="tutorial-message-title">{step.title}</span>
                  <span className="tutorial-message-text">{step.description}</span>
                </div>
              </div>
            </div>
          )}

          {/* ====== STEP 2: Gravity - Positioned exactly like real UI ====== */}
          {step.id === "gravity" && (
            <>
              {/* Message positioned above the UI clone */}
              <div className="tutorial-floating-message tutorial-floating-message--gravity">
                <div className="tutorial-message tutorial-message--center">
                  <div className="tutorial-key-inline">G</div>
                  <span className="tutorial-message-title">{step.title}</span>
                  <span className="tutorial-message-text">{step.description}</span>
                </div>
                <svg className="tutorial-arrow tutorial-arrow--down" viewBox="0 0 40 60" fill="none">
                  <path d="M20 10 L20 50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <path d="M15 40 L20 50 L25 40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {/* Clone positioned exactly like the real gravity UI */}
              <div className="tutorial-clone-gravity">
                <div className="retro-panel retro-scanlines tutorial-ui-clone" style={{ padding: '16px 24px' }}>
                  <div className="flex items-center gap-3">
                    <span className="retro-text" style={{ color: 'var(--retro-cyan)' }}>
                      ⬇️ GRAVITY
                    </span>
                    <span className="retro-text--small">Press</span>
                    <span className="retro-key animate-glow-pulse">G</span>
                    <span className="retro-text--small">to change direction</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ====== STEP 3: Blocks - Positioned exactly like real UI ====== */}
          {step.id === "blocks" && (
            <>
              {/* Message positioned to the left of the tab */}
              <div className="tutorial-floating-message tutorial-floating-message--blocks">
                <div className="tutorial-message">
                  <span className="tutorial-message-title">{step.title}</span>
                  <span className="tutorial-message-text">{step.description}</span>
                </div>
                <svg className="tutorial-arrow tutorial-arrow--right" viewBox="0 0 80 40" fill="none">
                  <path d="M10 20 L70 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <path d="M60 15 L70 20 L60 25" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {/* Clone positioned exactly like the real blocks tab */}
              <div className="tutorial-clone-blocks">
                <div 
                  className="tutorial-ui-clone"
                  style={{
                    background: 'linear-gradient(90deg, var(--retro-panel) 0%, var(--retro-dark) 100%)',
                    border: '3px solid var(--retro-cyan)',
                    padding: '20px 12px',
                    boxShadow: 'var(--glow-cyan)',
                    clipPath: 'polygon(0 8px, 8px 0, 100% 0, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
                  }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <ChevronLeft size={16} style={{ color: 'var(--retro-cyan)' }} />
                    <span
                      style={{
                        fontFamily: 'var(--font-pixel)',
                        fontSize: '8px',
                        color: 'var(--retro-cyan)',
                        textShadow: 'var(--glow-cyan)',
                        writingMode: 'vertical-rl',
                        textOrientation: 'mixed',
                        letterSpacing: '2px',
                      }}
                    >
                      BLOCKS
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ====== STEP 4: Room Info - Positioned exactly like real UI ====== */}
          {step.id === "roominfo" && (
            <>
              {/* Message positioned above the UI clone */}
              <div className="tutorial-floating-message tutorial-floating-message--roominfo">
                <div className="tutorial-message">
                  <span className="tutorial-message-title">{step.title}</span>
                  <span className="tutorial-message-text">{step.description}</span>
                </div>
                <svg className="tutorial-arrow tutorial-arrow--down-left" viewBox="0 0 60 60" fill="none">
                  <path d="M50 10 Q30 30 15 50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <path d="M10 40 L15 50 L25 45" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {/* Clone positioned exactly like the real room info */}
              <div className="tutorial-clone-roominfo">
                <div className="retro-panel retro-scanlines tutorial-ui-clone" style={{ padding: 0 }}>
                  <div 
                    className="flex items-center gap-4 px-4 py-3"
                    style={{ borderBottom: '2px solid var(--retro-border)' }}
                  >
                    <div className="retro-stat">
                      <span className="retro-stat__label">ROOM</span>
                      <span 
                        className="retro-stat__value" 
                        style={{ color: 'var(--retro-cyan)', textShadow: 'var(--glow-cyan)', fontSize: '12px' }}
                      >
                        4-4-4
                      </span>
                    </div>
                    <div className="retro-stat">
                      <span className="retro-stat__label">BLOCKS</span>
                      <span className="retro-stat__value">12</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <button className="retro-btn retro-btn--danger w-full flex items-center justify-center gap-2">
                      <Trash2 size={14} />
                      <span>CLEAR ROOM</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ====== STEP 5: Voice & Audio - Positioned exactly like real UI ====== */}
          {step.id === "voice" && (
            <>
              {/* Message positioned above the UI clone */}
              <div className="tutorial-floating-message tutorial-floating-message--voice">
                <div className="tutorial-message" style={{ alignItems: 'flex-end', textAlign: 'right' }}>
                  <span className="tutorial-message-title">{step.title}</span>
                  <span className="tutorial-message-text">{step.description}</span>
                </div>
                <svg className="tutorial-arrow tutorial-arrow--down-right" viewBox="0 0 60 60" fill="none">
                  <path d="M10 10 Q30 30 45 50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <path d="M35 45 L45 50 L50 40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {/* Clone positioned exactly like the real voice UI */}
              <div className="tutorial-clone-voice">
                <div className="retro-panel retro-scanlines tutorial-ui-clone" style={{ padding: 0, minWidth: '200px' }}>
                  <div className="retro-title" style={{ fontSize: '10px', padding: '12px 16px' }}>
                    🎤 VOICE & AUDIO
                  </div>
                  <div className="p-3 space-y-3">
                    <button className="retro-btn retro-btn--cyan w-full flex items-center justify-center gap-2">
                      <Volume2 size={14} />
                      <span>ENABLE AUDIO</span>
                    </button>
                    <button className="retro-btn retro-btn--green w-full flex items-center justify-center gap-2">
                      <Mic size={14} />
                      <span>ENABLE MIC</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Navigation Buttons - Positioned at top right, below progress dots */}
          <div className="tutorial-nav">
            <div className="tutorial-nav-buttons">
              {currentStep > 0 && (
                <button className="tutorial-back-btn" onClick={handleBack}>
                  <ChevronLeft size={18} />
                  <span>Back</span>
                </button>
              )}
              <button className="tutorial-next-btn" onClick={handleNext}>
                <span>{currentStep === TUTORIAL_STEPS.length - 1 ? "Got it!" : "Next"}</span>
                <ChevronRight size={18} />
              </button>
            </div>
            <button className="tutorial-skip-btn" onClick={handleSkip}>
              Skip Tutorial
            </button>
          </div>
        </div>
      )}
    </>
  );
}

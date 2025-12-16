import React, { useState, useCallback } from "react";
import { useHuddleAudio } from "@/context/HuddleAudioContext";
import { Mic, MicOff, Volume2, AlertTriangle, Check } from "lucide-react";

export default function VoiceToggle() {
  const { micEnabled, startMic, stopMic, error } = useHuddleAudio();
  const [audioEnabled, setAudioEnabled] = useState(false);

  const enableAudio = useCallback(() => {
    setAudioEnabled(true);
    // Unlock all audio elements
    const audios = Array.from(document.querySelectorAll("audio"));
    audios.forEach((el) => {
      try {
        el.autoplay = true;
        el.playsInline = true;
        el.muted = false;
        el.play().catch(() => {});
      } catch {
        // ignore
      }
    });
  }, []);

  return (
    <>
      {/* Mic Active Indicator - Always visible when mic is on */}
      {micEnabled && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
          <div 
            className="retro-badge retro-badge--active animate-glow-pulse flex items-center gap-2"
            style={{
              padding: '8px 16px',
              background: 'rgba(57, 255, 20, 0.15)',
              borderColor: 'var(--retro-green)',
              boxShadow: 'var(--glow-green)'
            }}
          >
            <Mic size={12} style={{ color: 'var(--retro-green)' }} />
            <span style={{ color: 'var(--retro-green)' }}>LIVE</span>
            <div className="flex gap-1 ml-1">
              <span 
                className="block w-1 h-2 animate-pulse"
                style={{ background: 'var(--retro-green)', animationDelay: '0s' }}
              />
              <span 
                className="block w-1 h-3 animate-pulse"
                style={{ background: 'var(--retro-green)', animationDelay: '0.15s' }}
              />
              <span 
                className="block w-1 h-2 animate-pulse"
                style={{ background: 'var(--retro-green)', animationDelay: '0.3s' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Hover Zone - Bottom Right */}
      <div 
        className="voice-ui-wrapper fixed bottom-0 right-0 z-50 group"
        style={{ padding: '40px', paddingBottom: '0', paddingRight: '0' }}
      >
        {/* Indicator - always visible, hides on hover */}
        <div 
          className="voice-ui-indicator absolute bottom-6 right-6 flex items-center gap-2 transition-all duration-300 group-hover:opacity-0 group-hover:scale-75"
        >
          <Mic 
            size={14} 
            className="animate-pulse"
            style={{ 
              color: 'var(--retro-cyan)',
              filter: 'drop-shadow(0 0 6px var(--retro-cyan))'
            }} 
          />
          <div 
            className="w-3 h-3 animate-pulse"
            style={{
              background: 'var(--retro-cyan)',
              boxShadow: 'var(--glow-cyan)',
            }}
          />
        </div>

        {/* Combined Voice & Audio Panel - hidden until hover */}
        <div 
          className="voice-ui-panel retro-panel retro-scanlines transition-all duration-300 ease-out opacity-0 translate-y-4 translate-x-4 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 mr-6 mb-6"
          style={{ padding: 0, minWidth: '200px' }}
        >
          {/* Panel Header */}
          <div className="retro-title" style={{ fontSize: '10px', padding: '12px 16px' }}>
            🎤 VOICE & AUDIO
          </div>

          <div className="p-3 space-y-3">
            {/* Audio Control */}
            {audioEnabled ? (
              <div 
                className="flex items-center gap-3 px-3 py-2"
                style={{ 
                  background: 'rgba(0, 255, 245, 0.1)',
                  border: '2px solid var(--retro-border)'
                }}
              >
                <Check size={14} style={{ color: 'var(--retro-cyan)' }} />
                <span 
                  className="retro-text--small"
                  style={{ 
                    fontFamily: 'var(--font-pixel)',
                    fontSize: '8px',
                    color: 'var(--retro-cyan)',
                    textTransform: 'uppercase'
                  }}
                >
                  Audio Enabled
                </span>
              </div>
            ) : (
              <button
                className="retro-btn retro-btn--cyan w-full flex items-center justify-center gap-2"
                onClick={enableAudio}
              >
                <Volume2 size={14} />
                <span>ENABLE AUDIO</span>
              </button>
            )}

            {/* Mic Control */}
            {micEnabled ? (
              <button
                className="retro-btn retro-btn--danger w-full flex items-center justify-center gap-2"
                onClick={stopMic}
              >
                <MicOff size={14} />
                <span>DISABLE MIC</span>
              </button>
            ) : (
              <button
                className="retro-btn retro-btn--green w-full flex items-center justify-center gap-2"
                onClick={startMic}
              >
                <Mic size={14} />
                <span>ENABLE MIC</span>
              </button>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div 
              className="flex items-center gap-2 px-3 py-2"
              style={{ 
                borderTop: '2px solid var(--retro-orange)',
                background: 'rgba(255, 107, 53, 0.1)'
              }}
            >
              <AlertTriangle size={12} style={{ color: 'var(--retro-orange)' }} />
              <span 
                className="retro-text--small"
                style={{ 
                  color: 'var(--retro-orange)',
                  fontSize: '14px'
                }}
              >
                {String(error).slice(0, 30)}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
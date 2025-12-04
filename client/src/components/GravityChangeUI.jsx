import { ArrowDown } from "lucide-react";

export function GravityChangeUI() {
  return (
    <div 
      className="gravity-ui-wrapper fixed bottom-0 left-1/2 transform -translate-x-1/2 z-50 group"
      style={{ padding: '40px 60px', paddingBottom: '0' }}
    >
      {/* Indicator - always visible, hides on hover */}
      <div 
        className="gravity-ui-indicator absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 transition-all duration-300 group-hover:opacity-0 group-hover:scale-75"
      >
        <div 
          className="w-3 h-3 animate-pulse"
          style={{
            background: 'var(--retro-cyan)',
            boxShadow: 'var(--glow-cyan)',
          }}
        />
        <ArrowDown 
          size={14} 
          className="animate-pulse"
          style={{ 
            color: 'var(--retro-cyan)',
            filter: 'drop-shadow(0 0 6px var(--retro-cyan))'
          }} 
        />
      </div>
      
      {/* Actual UI - hidden until hover */}
      <div 
        className="gravity-ui-panel retro-panel retro-scanlines transition-all duration-300 ease-out opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 mb-6"
        style={{ padding: '16px 24px' }}
      >
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
  );
}

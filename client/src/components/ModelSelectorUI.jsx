import { useState, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import Lottie from "lottie-react";
import {
  modelCatalog,
  modelCategories,
  scaleOptions,
  scaleDimensions,
} from "../models";
import { useRoom } from "./RoomContext";
import { X, HelpCircle, RotateCcw, Trash2, MousePointer, ChevronLeft, ChevronRight, ArrowLeft, Sparkles, Wallet, Image, Lamp, Armchair, Table2 } from "lucide-react";

// Premium blocks data - always available for purchase
const PREMIUM_BLOCKS = [
  {
    id: 'picture_frame',
    name: 'Picture Frame',
    price: 5,
    description: 'Display your own images on any surface',
    icon: Image,
    color: 'var(--retro-cyan)',
    customizable: true,
  },
  {
    id: 'wooden_table',
    name: 'Wooden Table',
    price: 5,
    description: 'Classic furniture for your room',
    icon: Table2,
    color: 'var(--retro-yellow)',
  },
  {
    id: 'classic_chair',
    name: 'Classic Chair',
    price: 5,
    description: 'Comfortable seating',
    icon: Armchair,
    color: 'var(--retro-green)',
  },
  {
    id: 'neon_lamp',
    name: 'Neon Lamp',
    price: 5,
    description: 'Emits light in your room!',
    icon: Lamp,
    color: 'var(--retro-magenta)',
    special: 'EMITS LIGHT',
  },
];

export function ModelSelectorUI() {
  const {
    selectedModel,
    setSelectedModel,
    isPlacementMode,
    setIsPlacementMode,
  } = useRoom();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSize, setSelectedSize] = useState("small");
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Premium shop states
  const [shopView, setShopView] = useState('free'); // 'free' | 'loading' | 'premium'
  const [cubeAnimation, setCubeAnimation] = useState(null);
  
  // TODO: Replace with actual owned blocks from blockchain/backend
  const [ownedPremiumBlocks, setOwnedPremiumBlocks] = useState([]);

  // Preload essential models when component mounts
  useEffect(() => {
    const essentialModels = [];
    const categories = {};

    modelCatalog.forEach((model) => {
      if (!categories[model.category] && essentialModels.length < 5) {
        categories[model.category] = true;
        essentialModels.push(model);
      }
    });

    essentialModels.forEach((model) => {
      useGLTF.preload(model.path);
    });
  }, []);

  // Load Lottie animation for premium shop transition
  useEffect(() => {
    fetch("/animations/DynamicCube.json")
      .then((res) => res.json())
      .then((data) => setCubeAnimation(data))
      .catch((err) => console.error("Failed to load cube animation:", err));
  }, []);

  // Handle "Get More" button click
  const handleGetMore = () => {
    setShopView('loading');
    setTimeout(() => setShopView('premium'), 1000);
  };

  // Handle back to free blocks
  const handleBackToFree = () => {
    setShopView('free');
  };

  // Handle premium block purchase
  const handlePurchaseBlock = (block) => {
    // TODO: Implement wallet connection and NFT minting
    console.log(`Purchasing block: ${block.name} for $${block.price}`);
    alert(`Wallet connection coming soon! You're purchasing "${block.name}" for $${block.price} USDT`);
  };

  // Check if a premium block is owned
  const isBlockOwned = (blockId) => {
    return ownedPremiumBlocks.includes(blockId);
  };

  const filteredModels =
    selectedCategory === "all"
      ? modelCatalog
      : modelCatalog.filter((model) => model.category === selectedCategory);

  const handleSelectModel = (model) => {
    useGLTF.preload(model.path);

    const scaledModel = {
      ...model,
      scale: scaleOptions[selectedSize],
      gridDimensions: scaleDimensions[selectedSize],
    };

    setSelectedModel(scaledModel);
    setIsPlacementMode(true);
  };

  const handleSizeChange = (size) => {
    setSelectedSize(size);

    if (selectedModel && isPlacementMode) {
      const updatedModel = {
        ...selectedModel,
        scale: scaleOptions[size],
        gridDimensions: scaleDimensions[size],
      };
      setSelectedModel(updatedModel);
    }
  };

  const handleCancelPlacement = () => {
    setIsPlacementMode(false);
    setSelectedModel(null);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const getModelImagePath = (modelPath) => {
    return modelPath.replace(".gltf", ".png");
  };

  const handleModelHover = (model) => {
    try {
      useGLTF.preload(model.path);
    } catch (error) {
      console.warn("Error preloading model:", error);
    }
  };

  return (
    <>
      {/* Edge Tab Button - Always visible on the right edge */}
      <button
        className={`fixed top-1/2 -translate-y-1/2 z-50 transition-all duration-300 ${
          isSidebarOpen ? 'right-[356px]' : 'right-0'
        }`}
        onClick={toggleSidebar}
        style={{
          background: 'linear-gradient(90deg, var(--retro-panel) 0%, var(--retro-dark) 100%)',
          border: '3px solid var(--retro-cyan)',
          borderRight: isSidebarOpen ? '3px solid var(--retro-cyan)' : 'none',
          padding: '20px 8px',
          cursor: 'pointer',
          boxShadow: 'var(--glow-cyan)',
          clipPath: isSidebarOpen 
            ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
            : 'polygon(0 8px, 8px 0, 100% 0, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
        }}
      >
        <div className="flex flex-col items-center gap-2">
          {isSidebarOpen ? (
            <ChevronRight size={16} style={{ color: 'var(--retro-cyan)' }} />
          ) : (
            <ChevronLeft size={16} style={{ color: 'var(--retro-cyan)' }} />
          )}
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
      </button>

      {/* Model Selector Sidebar */}
      <div
        className={`fixed right-0 top-0 z-40 transition-all duration-300 ease-out ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ paddingTop: '24px', paddingRight: '16px' }}
      >
        <div 
          className="retro-panel retro-scanlines w-[340px] overflow-hidden flex flex-col"
          style={{ maxHeight: 'calc(100vh - 300px)', minHeight: '400px' }}
        >
          {/* Header - changes based on view */}
          <div className="retro-title flex items-center justify-between flex-shrink-0">
            {shopView === 'premium' ? (
              <>
                <button
                  onClick={handleBackToFree}
                  className="retro-btn flex items-center gap-2"
                  style={{ padding: '6px 12px', fontSize: '8px' }}
                >
                  <ArrowLeft size={12} />
                  BACK
                </button>
                <span className="flex items-center gap-2">
                  <Sparkles size={14} style={{ color: 'var(--retro-magenta)' }} />
                  PREMIUM
                </span>
              </>
            ) : (
              <>
                <span>⬛ BLOCKS</span>
                <button
                  onClick={() => setIsHelpDialogOpen(true)}
                  className="retro-btn"
                  style={{ padding: '6px 10px', fontSize: '8px' }}
                >
                  <HelpCircle size={14} />
                </button>
              </>
            )}
          </div>

          {/* LOADING VIEW - Lottie animation transition */}
          {shopView === 'loading' && (
            <div 
              className="flex flex-col items-center justify-center py-12 flex-1"
              style={{ minHeight: 'calc(100vh - 380px)' }}
            >
              {cubeAnimation && (
                <Lottie 
                  animationData={cubeAnimation} 
                  loop={true}
                  style={{ width: 120, height: 120 }}
                />
              )}
              <span 
                className="mt-4"
                style={{
                  fontFamily: 'var(--font-pixel)',
                  fontSize: '10px',
                  color: 'var(--retro-cyan)',
                  textShadow: 'var(--glow-cyan)',
                  letterSpacing: '2px',
                }}
              >
                LOADING PREMIUM...
              </span>
            </div>
          )}

          {/* PREMIUM VIEW - Premium blocks for purchase */}
          {shopView === 'premium' && (
            <div className="p-4 space-y-5 overflow-y-auto flex-1 retro-scroll">
              {/* Info Banner */}
              <div 
                className="animate-slide-up p-3 rounded"
                style={{ 
                  background: 'rgba(255, 0, 255, 0.1)',
                  border: '2px solid var(--retro-magenta)',
                  animationDelay: '0.05s'
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={14} style={{ color: 'var(--retro-magenta)' }} />
                  <span style={{
                    fontFamily: 'var(--font-pixel)',
                    fontSize: '9px',
                    color: 'var(--retro-magenta)',
                    textShadow: '0 0 5px var(--retro-magenta)',
                  }}>
                    NFT BLOCKS
                  </span>
                </div>
                <p style={{
                  fontFamily: 'var(--font-pixel)',
                  fontSize: '8px',
                  color: 'rgba(255,255,255,0.8)',
                  lineHeight: '1.6',
                  margin: 0,
                }}>
                  Premium blocks are NFTs - yours forever once purchased!
                </p>
              </div>

              {/* Premium Blocks Grid */}
              <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="retro-label">✨ Premium Blocks</div>
                <div className="space-y-3">
                  {PREMIUM_BLOCKS.map((block) => {
                    const IconComponent = block.icon;
                    const owned = isBlockOwned(block.id);
                    
                    return (
                      <div
                        key={block.id}
                        className="premium-block-card"
                        style={{
                          background: 'rgba(0, 0, 0, 0.4)',
                          border: `2px solid ${owned ? 'var(--retro-green)' : 'var(--retro-border)'}`,
                          borderRadius: '4px',
                          padding: '12px',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div 
                            className="flex items-center justify-center flex-shrink-0"
                            style={{
                              width: '48px',
                              height: '48px',
                              background: `${block.color}15`,
                              border: `2px solid ${block.color}`,
                              borderRadius: '4px',
                            }}
                          >
                            <IconComponent size={24} style={{ color: block.color }} />
                          </div>
                          
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span style={{
                                fontFamily: 'var(--font-pixel)',
                                fontSize: '9px',
                                color: '#fff',
                              }}>
                                {block.name.toUpperCase()}
                              </span>
                              {block.special && (
                                <span style={{
                                  fontFamily: 'var(--font-pixel)',
                                  fontSize: '6px',
                                  color: block.color,
                                  background: `${block.color}20`,
                                  padding: '2px 6px',
                                  borderRadius: '2px',
                                }}>
                                  {block.special}
                                </span>
                              )}
                            </div>
                            <p style={{
                              fontFamily: 'var(--font-pixel)',
                              fontSize: '7px',
                              color: 'rgba(255,255,255,0.6)',
                              margin: 0,
                              lineHeight: '1.5',
                            }}>
                              {block.description}
                            </p>
                          </div>
                        </div>
                        
                        {/* Price & Button */}
                        <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid var(--retro-border)' }}>
                          <span style={{
                            fontFamily: 'var(--font-pixel)',
                            fontSize: '10px',
                            color: 'var(--retro-green)',
                            textShadow: '0 0 5px var(--retro-green)',
                          }}>
                            ${block.price} USDT
                          </span>
                          
                          {owned ? (
                            <span 
                              className="flex items-center gap-1"
                              style={{
                                fontFamily: 'var(--font-pixel)',
                                fontSize: '8px',
                                color: 'var(--retro-green)',
                              }}
                            >
                              ✓ OWNED
                            </span>
                          ) : (
                            <button
                              className="retro-btn retro-btn--magenta flex items-center gap-2"
                              onClick={() => handlePurchaseBlock(block)}
                              style={{ 
                                padding: '8px 12px',
                                fontSize: '8px',
                              }}
                            >
                              <Wallet size={12} />
                              PURCHASE
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* FREE VIEW - Regular blocks */}
          {shopView === 'free' && (
            <>
              <div className="p-4 space-y-5 overflow-y-auto flex-1 retro-scroll">
                {/* Size Selector */}
                <div className="animate-slide-up" style={{ animationDelay: '0.05s' }}>
                  <div className="retro-label">📐 Size</div>
                  <div className="retro-grid retro-grid--3col">
                    {['small', 'medium', 'large'].map((size) => (
                      <button
                        key={size}
                        className={`retro-btn ${selectedSize === size ? 'retro-btn--magenta' : ''}`}
                        onClick={() => handleSizeChange(size)}
                        style={{ 
                          padding: '10px 8px',
                          boxShadow: selectedSize === size ? 'var(--glow-magenta)' : 'none'
                        }}
                      >
                        {size.charAt(0).toUpperCase()}
                      </button>
                    ))}
              </div>
            </div>

                {/* Category Selector */}
                <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  <div className="retro-label">📁 Category</div>
                  <div className="retro-grid retro-grid--2col">
                    <button
                      className={`retro-btn ${selectedCategory === 'all' ? 'retro-btn--green' : ''}`}
                      onClick={() => setSelectedCategory('all')}
                      style={{ 
                        padding: '10px',
                        boxShadow: selectedCategory === 'all' ? 'var(--glow-green)' : 'none'
                      }}
                    >
                      ALL
                    </button>
                {modelCategories.map((category) => (
                      <button
                    key={category.id}
                        className={`retro-btn ${selectedCategory === category.id ? 'retro-btn--green' : ''}`}
                    onClick={() => setSelectedCategory(category.id)}
                        style={{ 
                          padding: '10px',
                          boxShadow: selectedCategory === category.id ? 'var(--glow-green)' : 'none'
                        }}
                  >
                        {category.name.toUpperCase()}
                      </button>
                ))}
              </div>
            </div>

                {/* Models Grid */}
                <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
                  <div className="retro-label">🧱 Select Block</div>
                  <div className="retro-grid retro-grid--2col">
                    {filteredModels.map((model) => {
                      const isSelected = selectedModel?.modelId === model.id || selectedModel?.id === model.id;
                      return (
                    <div
                      key={model.id}
                          className={`retro-card ${isSelected ? 'retro-card--selected' : ''}`}
                          onClick={() => handleSelectModel(model)}
                      onMouseEnter={() => handleModelHover(model)}
                    >
                          <div className="retro-card__image">
                          <img
                              src={getModelImagePath(model.path) || "/placeholder.svg"}
                            alt={model.name}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/placeholder.svg";
                            }}
                          />
                        </div>
                          <div className="retro-card__name">
                            {model.name}
                          </div>
                        </div>
                      );
                    })}
                    </div>
                </div>
            </div>

              {/* Footer with Cancel and Get More buttons */}
              <div className="p-4 border-t-2 flex-shrink-0 space-y-2" style={{ borderColor: 'var(--retro-border)' }}>
                {isPlacementMode && (
                  <button
                    className="retro-btn retro-btn--danger w-full"
                onClick={handleCancelPlacement}
                  >
                    ✕ CANCEL
                  </button>
                )}
                <button
                  className="retro-btn w-full flex items-center justify-center gap-2 premium-get-more-btn"
                  onClick={handleGetMore}
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,0,255,0.2) 0%, rgba(0,255,255,0.2) 100%)',
                    border: '2px solid var(--retro-magenta)',
                  }}
                >
                  <Sparkles size={14} style={{ color: 'var(--retro-magenta)' }} />
                  <span>GET MORE BLOCKS</span>
                  <span 
                    className="ml-1"
                    style={{
                      background: 'var(--retro-magenta)',
                      color: '#000',
                      padding: '2px 6px',
                      fontSize: '7px',
                      borderRadius: '2px',
                    }}
                  >
                    NEW
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Help Dialog */}
      {isHelpDialogOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0, 0, 0, 0.8)' }}
          onClick={() => setIsHelpDialogOpen(false)}
        >
          <div 
            className="retro-panel retro-scanlines w-[400px] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="retro-title flex items-center justify-between">
              <span>📖 CONTROLS</span>
              <button
                onClick={() => setIsHelpDialogOpen(false)}
                className="retro-btn"
                style={{ padding: '6px 10px' }}
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Placement Controls */}
              <div>
                <div className="retro-label mb-3">🎮 Placement</div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <MousePointer className="w-5 h-5" style={{ color: 'var(--retro-cyan)' }} />
                    <span className="retro-text--small">Click to place block</span>
              </div>
                  <div className="flex items-center gap-3">
                    <span className="retro-key">R</span>
                    <span className="retro-text--small">Rotate before placing</span>
            </div>
            <div className="flex items-center gap-3">
                    <span className="retro-key">ESC</span>
                    <span className="retro-text--small">Exit placement mode</span>
              </div>
              </div>
            </div>

              {/* Model Controls */}
              <div className="pt-3" style={{ borderTop: '2px solid var(--retro-border)' }}>
                <div className="retro-label mb-3">🔧 Model Edit</div>
                <div className="space-y-3">
            <div className="flex items-center gap-3">
                    <RotateCcw className="w-5 h-5" style={{ color: 'var(--retro-magenta)' }} />
                    <span className="retro-text--small">
                      <span className="retro-key">R</span> Rotate selected
                    </span>
              </div>
            <div className="flex items-center gap-3">
                    <Trash2 className="w-5 h-5" style={{ color: 'var(--retro-orange)' }} />
                    <span className="retro-text--small">
                      <span className="retro-key">DEL</span> Delete selected
                    </span>
              </div>
            </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

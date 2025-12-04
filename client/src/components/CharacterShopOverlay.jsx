import { useState, useEffect } from "react";
import { X, ArrowLeft, Sparkles, Home, Wallet } from "lucide-react";
import { useCharacter } from "./CharacterContext";

// Sample character data - 20 unique characters (4 columns x 5 rows)
const CHARACTERS = [
  { id: 1, name: "Shadow Knight", image: "/models/characters/knight.png", sold: false },
  { id: 2, name: "Flame Mage", image: "/models/characters/mage.png", sold: false },
  { id: 3, name: "Storm Barbarian", image: "/models/characters/barbarian.png", sold: true, owner: "CryptoKing" },
  { id: 4, name: "Silent Rogue", image: "/models/characters/rogue.png", sold: false },
  { id: 5, name: "Hooded Assassin", image: "/models/characters/rogue_hooded.png", sold: false },
  { id: 6, name: "Frost Warden", image: "/models/characters/knight.png", sold: false },
  { id: 7, name: "Ember Sorcerer", image: "/models/characters/mage.png", sold: true, owner: "BlockMaster" },
  { id: 8, name: "Iron Titan", image: "/models/characters/barbarian.png", sold: false },
  { id: 9, name: "Phantom Blade", image: "/models/characters/rogue.png", sold: false },
  { id: 10, name: "Void Walker", image: "/models/characters/rogue_hooded.png", sold: false },
  { id: 11, name: "Crystal Paladin", image: "/models/characters/knight.png", sold: false },
  { id: 12, name: "Thunder Shaman", image: "/models/characters/mage.png", sold: false },
  { id: 13, name: "Blood Berserker", image: "/models/characters/barbarian.png", sold: false },
  { id: 14, name: "Night Stalker", image: "/models/characters/rogue.png", sold: true, owner: "NFTWhale" },
  { id: 15, name: "Dark Sentinel", image: "/models/characters/rogue_hooded.png", sold: false },
  { id: 16, name: "Light Bringer", image: "/models/characters/knight.png", sold: false },
  { id: 17, name: "Chaos Wizard", image: "/models/characters/mage.png", sold: false },
  { id: 18, name: "Earth Crusher", image: "/models/characters/barbarian.png", sold: false },
  { id: 19, name: "Swift Shadow", image: "/models/characters/rogue.png", sold: false },
  { id: 20, name: "Mystic Hunter", image: "/models/characters/rogue_hooded.png", sold: false },
];

const PRICE = 20; // USDT

export default function CharacterShopOverlay({ isOpen, onClose }) {
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [characterName, setCharacterName] = useState("");
  const [isNaming, setIsNaming] = useState(false);
  
  // Get controls disabled setter from context
  const { setControlsDisabled } = useCharacter();

  // Disable game controls when overlay is open
  useEffect(() => {
    setControlsDisabled(isOpen);
    return () => setControlsDisabled(false);
  }, [isOpen, setControlsDisabled]);

  // Reset state when overlay closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedCharacter(null);
      setCharacterName("");
      setIsNaming(false);
    }
  }, [isOpen]);

  const handleSelectCharacter = (character) => {
    if (character.sold) return;
    setSelectedCharacter(character);
    setIsNaming(true);
  };

  const handleBack = () => {
    setSelectedCharacter(null);
    setCharacterName("");
    setIsNaming(false);
  };

  const handleMint = () => {
    if (!characterName.trim()) return;
    // TODO: Implement wallet connection and minting
    console.log(`Minting character: ${selectedCharacter.name} as "${characterName}"`);
    alert(`Wallet connection coming soon! You're minting "${characterName}"`);
  };

  const isValidName = characterName.trim().length >= 3 && characterName.trim().length <= 16;

  if (!isOpen) return null;

  return (
    <div className="char-shop-overlay">
      {/* Backdrop */}
      <div className="char-shop-backdrop" onClick={onClose} />

      {/* Main Container */}
      <div className="char-shop-container">
        {/* Header */}
        <div className="char-shop-header">
          {isNaming ? (
            <button className="char-shop-back-btn" onClick={handleBack}>
              <ArrowLeft size={18} />
              <span>BACK</span>
            </button>
          ) : (
            <div className="char-shop-title">
              <Sparkles size={20} />
              <span>CHARACTER SHOP</span>
            </div>
          )}
          <button className="char-shop-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Price Banner */}
        <div className="char-shop-price-banner">
          <span className="char-shop-price-text">
            🎮 ALL CHARACTERS: <span className="char-shop-price">{PRICE} USDT</span>
          </span>
          <span className="char-shop-nft-badge">
            <Home size={14} />
            INCLUDES PRIVATE ROOM NFT
          </span>
        </div>

        {/* Content Area */}
        <div className="char-shop-content">
          {!isNaming ? (
            <>
              {/* Character Grid */}
              <div className="char-shop-grid">
                {CHARACTERS.map((character) => (
                  <div
                    key={character.id}
                    className={`char-card ${character.sold ? "char-card--sold" : ""}`}
                    onClick={() => handleSelectCharacter(character)}
                  >
                    <div className="char-card-image-wrapper">
                      <img
                        src={character.image}
                        alt={character.name}
                        className="char-card-image"
                      />
                      {character.sold && (
                        <div className="char-card-sold-overlay">
                          <span className="char-card-sold-text">SOLD</span>
                          <span className="char-card-owner">@{character.owner}</span>
                        </div>
                      )}
                    </div>
                    <div className="char-card-name">{character.name}</div>
                  </div>
                ))}
              </div>

              {/* Bonus Info Card */}
              <div className="char-shop-bonus-card">
                <div className="char-shop-bonus-badge">🎁 BONUS</div>
                <div className="char-shop-bonus-content">
                  <p className="char-shop-bonus-title">Each character comes with a PRIVATE ROOM</p>
                  <p className="char-shop-bonus-text">
                    Only YOU can place and modify blocks in your room. Your character and room are NFTs that you truly own!
                  </p>
                </div>
              </div>
            </>
          ) : (
            /* Naming View */
            <div className="char-shop-naming">
              {/* Selected Character Display */}
              <div className="char-shop-selected">
                <div className="char-shop-selected-glow" />
                <img
                  src={selectedCharacter.image}
                  alt={selectedCharacter.name}
                  className="char-shop-selected-image"
                />
                <div className="char-shop-selected-type">{selectedCharacter.name}</div>
              </div>

              {/* Naming Form */}
              <div className="char-shop-naming-form">
                <label className="char-shop-naming-label">NAME YOUR CHARACTER</label>
                <input
                  type="text"
                  className="char-shop-naming-input"
                  placeholder="Enter a name (3-16 characters)"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value.slice(0, 16))}
                  autoFocus
                />
                <div className="char-shop-naming-hint">
                  {characterName.length}/16 characters
                  {isValidName && <span className="char-shop-naming-valid">✓ Valid</span>}
                </div>

                {/* Mint Button */}
                <button
                  className={`char-shop-mint-btn ${!isValidName ? "char-shop-mint-btn--disabled" : ""}`}
                  onClick={handleMint}
                  disabled={!isValidName}
                >
                  <Wallet size={18} />
                  <span>
                    {isValidName
                      ? `ENTER THE WORLD AS "${characterName.toUpperCase()}"`
                      : "ENTER A VALID NAME"}
                  </span>
                  <span className="char-shop-mint-price">{PRICE} USDT</span>
                </button>
              </div>

              {/* Reminder about what they get */}
              <div className="char-shop-reminder">
                <span>🎁 You'll receive: </span>
                <span className="char-shop-reminder-item">1 Unique Character NFT</span>
                <span className="char-shop-reminder-divider">+</span>
                <span className="char-shop-reminder-item">1 Private Room NFT</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


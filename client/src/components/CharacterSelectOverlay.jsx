import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Swords, Check, Loader2, ChevronRight } from "lucide-react";

export default function CharacterSelectOverlay({
  isOpen,
  onClose,
  onCharacterSelected,
  walletAddress,
  playerData,
}) {
  const [selectedCharacterId, setSelectedCharacterId] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const updateSelectedCharacter = useMutation(api.players.updateSelectedCharacter);

  // Set default selection when player data loads
  useEffect(() => {
    if (playerData?.selectedCharacterId) {
      setSelectedCharacterId(playerData.selectedCharacterId);
    } else if (playerData?.characters?.length > 0) {
      setSelectedCharacterId(playerData.characters[0].id);
    }
  }, [playerData]);

  if (!isOpen || !playerData) return null;

  const characters = playerData.characters || [];

  const handleCharacterSelect = (charId) => {
    setSelectedCharacterId(charId);
  };

  const handleConfirm = async () => {
    if (!selectedCharacterId) return;

    setIsConfirming(true);
    try {
      await updateSelectedCharacter({
        walletAddress,
        characterId: selectedCharacterId,
      });

      const selectedChar = characters.find((c) => c.id === selectedCharacterId);
      onCharacterSelected(selectedChar);
    } catch (e) {
      console.error("Failed to update character:", e);
    } finally {
      setIsConfirming(false);
    }
  };

  const selectedCharacter = characters.find((c) => c.id === selectedCharacterId);

  return (
    <div className="char-select-overlay">
      {/* Backdrop */}
      <div className="char-select-backdrop" />

      {/* Container */}
      <div className="char-select-container">
        {/* Scanline effect */}
        <div className="char-select-scanlines" />

        {/* Header */}
        <div className="char-select-header">
          <div className="char-select-title">
            <Swords size={24} />
            <span>SELECT YOUR CHARACTER</span>
          </div>
          <p className="char-select-subtitle">
            Choose your hero to enter the Block Quest dimension
          </p>
        </div>

        {/* Wallet Info */}
        <div className="char-select-wallet-info">
          <span className="char-select-wallet-label">CONNECTED</span>
          <span className="char-select-wallet-address">
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </span>
        </div>

        {/* Character Grid */}
        <div className="char-select-grid">
          {characters.map((character) => {
            const isSelected = selectedCharacterId === character.id;
            return (
              <button
                key={character.id}
                className={`char-select-card ${isSelected ? "char-select-card--selected" : ""}`}
                onClick={() => handleCharacterSelect(character.id)}
              >
                {/* Selection indicator */}
                {isSelected && (
                  <div className="char-select-card-check">
                    <Check size={16} />
                  </div>
                )}

                {/* Character image */}
                <div className="char-select-card-image-wrapper">
                  <img
                    src={character.imageUrl}
                    alt={character.name}
                    className="char-select-card-image"
                    onError={(e) => {
                      // Fallback to placeholder if image fails
                      e.target.src = "/models/characters/mage.png";
                    }}
                  />
                </div>

                {/* Character info */}
                <div className="char-select-card-info">
                  <span className="char-select-card-name">{character.name}</span>
                  <span className="char-select-card-type">{character.type}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Character Preview */}
        {selectedCharacter && (
          <div className="char-select-preview">
            <div className="char-select-preview-info">
              <span className="char-select-preview-name">
                {selectedCharacter.name}
              </span>
              <span className="char-select-preview-type">
                {selectedCharacter.type}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="char-select-actions">
          <button
            className="char-select-btn char-select-btn--confirm"
            onClick={handleConfirm}
            disabled={!selectedCharacterId || isConfirming}
          >
            {isConfirming ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>ENTERING...</span>
              </>
            ) : (
              <>
                <span>ENTER THE GAME</span>
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </div>

        {/* Info Footer */}
        <div className="char-select-footer">
          <span className="char-select-footer-text">
            Your character and progress will be saved to your Universal Profile
          </span>
        </div>
      </div>
    </div>
  );
}


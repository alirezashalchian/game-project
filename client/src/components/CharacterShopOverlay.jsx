import { useState, useEffect, useCallback } from "react";
import { X, ArrowLeft, Sparkles, Home, Wallet, Loader2, AlertCircle, MapPin } from "lucide-react";
import { useCharacter } from "./CharacterContext";
import { useWallet } from "../context/WalletContext";
import { useCharacterNFT } from "../hooks/useCharacterNFT";
import { CharacterType } from "../contracts/config";
import { formatEther } from "viem";

// Character type options with images
const CHARACTER_TYPES = [
  { type: CharacterType.Mage, name: "Mage", image: "/models/characters/mage.png" },
  { type: CharacterType.Barbarian, name: "Barbarian", image: "/models/characters/barbarian.png" },
  { type: CharacterType.Knight, name: "Knight", image: "/models/characters/knight.png" },
  { type: CharacterType.Rogue, name: "Rogue", image: "/models/characters/rogue.png" },
];

// Minting steps
const STEPS = {
  SELECT_TYPE: "select_type",
  NAME_CHARACTER: "name_character",
  SELECT_ROOM: "select_room",
  CONFIRM: "confirm",
  MINTING: "minting",
  SUCCESS: "success",
};

export default function CharacterShopOverlay({ isOpen, onClose, onMintSuccess }) {
  // State
  const [step, setStep] = useState(STEPS.SELECT_TYPE);
  const [selectedType, setSelectedType] = useState(null);
  const [characterName, setCharacterName] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [mintPrice, setMintPrice] = useState(null);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [mintError, setMintError] = useState(null);
  const [mintedTokenId, setMintedTokenId] = useState(null);

  // Hooks
  const { setControlsDisabled } = useCharacter();
  const { isConnected, connect, isConnecting } = useWallet();
  const {
    getMintPrice,
    getAvailableRooms,
    mintCharacter,
    isLoading: isMinting,
    error: mintHookError,
  } = useCharacterNFT();

  // Disable game controls when overlay is open
  useEffect(() => {
    setControlsDisabled(isOpen);
    return () => setControlsDisabled(false);
  }, [isOpen, setControlsDisabled]);

  // Reset state when overlay closes
  useEffect(() => {
    if (!isOpen) {
      setStep(STEPS.SELECT_TYPE);
      setSelectedType(null);
      setCharacterName("");
      setSelectedRoom(null);
      setMintError(null);
      setMintedTokenId(null);
    }
  }, [isOpen]);

  // Load mint price and available rooms when overlay opens
  useEffect(() => {
    if (isOpen && isConnected) {
      loadContractData();
    }
  }, [isOpen, isConnected]);

  const loadContractData = useCallback(async () => {
    try {
      // Get mint price
      const price = await getMintPrice();
      setMintPrice(price);
    } catch (e) {
      console.error("Failed to load mint price:", e);
    }
  }, [getMintPrice]);

  const loadAvailableRooms = useCallback(async () => {
    setLoadingRooms(true);
    try {
      const rooms = await getAvailableRooms();
      // Limit to first 50 rooms for performance
      setAvailableRooms(rooms.slice(0, 50));
    } catch (e) {
      console.error("Failed to load available rooms:", e);
    } finally {
      setLoadingRooms(false);
    }
  }, [getAvailableRooms]);

  // Handle step navigation
  const handleSelectType = (type) => {
    setSelectedType(type);
    setStep(STEPS.NAME_CHARACTER);
  };

  const handleNameSubmit = () => {
    if (isValidName) {
      loadAvailableRooms();
      setStep(STEPS.SELECT_ROOM);
    }
  };

  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
    setStep(STEPS.CONFIRM);
  };

  const handleBack = () => {
    setMintError(null);
    if (step === STEPS.NAME_CHARACTER) {
      setStep(STEPS.SELECT_TYPE);
      setSelectedType(null);
    } else if (step === STEPS.SELECT_ROOM) {
      setStep(STEPS.NAME_CHARACTER);
    } else if (step === STEPS.CONFIRM) {
      setStep(STEPS.SELECT_ROOM);
      setSelectedRoom(null);
    }
  };

  const handleMint = async () => {
    if (!selectedType || !characterName || !selectedRoom) return;

    setMintError(null);
    setStep(STEPS.MINTING);

    try {
      const hash = await mintCharacter({
        characterType: selectedType.type,
        name: characterName.trim(),
        imageUrl: selectedType.image,
        roomX: selectedRoom.x,
        roomY: selectedRoom.y,
        roomZ: selectedRoom.z,
      });

      setMintedTokenId(hash);
      setStep(STEPS.SUCCESS);

      // Notify parent of successful mint
      if (onMintSuccess) {
        onMintSuccess({
          tokenId: hash,
          characterType: selectedType.type,
          name: characterName,
          room: selectedRoom,
        });
      }
    } catch (e) {
      console.error("Mint failed:", e);
      setMintError(e.message || "Failed to mint character");
      setStep(STEPS.CONFIRM);
    }
  };

  const handleConnectWallet = async () => {
    try {
      await connect();
    } catch (e) {
      console.error("Failed to connect wallet:", e);
    }
  };

  const isValidName = characterName.trim().length >= 3 && characterName.trim().length <= 16;
  const formattedPrice = mintPrice ? formatEther(mintPrice) : "1";

  if (!isOpen) return null;

  return (
    <div className="char-shop-overlay">
      {/* Backdrop */}
      <div className="char-shop-backdrop" onClick={step !== STEPS.MINTING ? onClose : undefined} />

      {/* Main Container */}
      <div className="char-shop-container">
        {/* Header */}
        <div className="char-shop-header">
          {step !== STEPS.SELECT_TYPE && step !== STEPS.MINTING && step !== STEPS.SUCCESS ? (
            <button className="char-shop-back-btn" onClick={handleBack}>
              <ArrowLeft size={18} />
              <span>BACK</span>
            </button>
          ) : (
            <div className="char-shop-title">
              <Sparkles size={20} />
              <span>MINT YOUR CHARACTER</span>
            </div>
          )}
          {step !== STEPS.MINTING && (
            <button className="char-shop-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          )}
        </div>

        {/* Price Banner */}
        <div className="char-shop-price-banner">
          <span className="char-shop-price-text">
            🎮 MINT PRICE: <span className="char-shop-price">{formattedPrice} LYX</span>
          </span>
          <span className="char-shop-nft-badge">
            <Home size={14} />
            INCLUDES PRIVATE ROOM
          </span>
        </div>

        {/* Content Area */}
        <div className="char-shop-content">
          {/* Not Connected - Show Connect Button */}
          {!isConnected && (
            <div className="char-shop-connect">
              <Wallet size={48} className="char-shop-connect-icon" />
              <h3 className="char-shop-connect-title">Connect Your Wallet</h3>
              <p className="char-shop-connect-text">
                Connect your Universal Profile to mint a character and claim your room.
              </p>
              <button
                className="char-shop-mint-btn"
                onClick={handleConnectWallet}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>CONNECTING...</span>
                  </>
                ) : (
                  <>
                    <Wallet size={18} />
                    <span>CONNECT WALLET</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 1: Select Character Type */}
          {isConnected && step === STEPS.SELECT_TYPE && (
            <>
              <h3 className="char-shop-step-title">1. Choose Your Character Type</h3>
              <div className="char-shop-grid char-shop-grid--types">
                {CHARACTER_TYPES.map((charType) => (
                  <div
                    key={charType.type}
                    className="char-card"
                    onClick={() => handleSelectType(charType)}
                  >
                    <div className="char-card-image-wrapper">
                      <img
                        src={charType.image}
                        alt={charType.name}
                        className="char-card-image"
                      />
                    </div>
                    <div className="char-card-name">{charType.name}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Step 2: Name Character */}
          {isConnected && step === STEPS.NAME_CHARACTER && selectedType && (
            <div className="char-shop-naming">
              <div className="char-shop-selected">
                <div className="char-shop-selected-glow" />
                <img
                  src={selectedType.image}
                  alt={selectedType.name}
                  className="char-shop-selected-image"
                />
                <div className="char-shop-selected-type">{selectedType.name}</div>
              </div>

              <div className="char-shop-naming-form">
                <label className="char-shop-naming-label">2. NAME YOUR CHARACTER</label>
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

                <button
                  className={`char-shop-mint-btn ${!isValidName ? "char-shop-mint-btn--disabled" : ""}`}
                  onClick={handleNameSubmit}
                  disabled={!isValidName}
                >
                  <span>CONTINUE TO ROOM SELECTION</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Select Room */}
          {isConnected && step === STEPS.SELECT_ROOM && (
            <>
              <h3 className="char-shop-step-title">3. Select Your Room Location</h3>
              <p className="char-shop-step-desc">
                Choose a room in the 9×9×9 grid. This will be your private space!
              </p>

              {loadingRooms ? (
                <div className="char-shop-loading">
                  <Loader2 size={32} className="animate-spin" />
                  <span>Loading available rooms...</span>
                </div>
              ) : (
                <div className="char-shop-rooms-grid">
                  {availableRooms.map((room, index) => (
                    <button
                      key={`${room.x}-${room.y}-${room.z}`}
                      className="char-shop-room-btn"
                      onClick={() => handleSelectRoom(room)}
                    >
                      <MapPin size={14} />
                      <span>({room.x}, {room.y}, {room.z})</span>
                    </button>
                  ))}
                </div>
              )}

              {availableRooms.length === 0 && !loadingRooms && (
                <div className="char-shop-no-rooms">
                  <AlertCircle size={24} />
                  <span>No available rooms found. All 729 rooms may be claimed!</span>
                </div>
              )}
            </>
          )}

          {/* Step 4: Confirm */}
          {isConnected && step === STEPS.CONFIRM && selectedType && selectedRoom && (
            <div className="char-shop-confirm">
              <h3 className="char-shop-step-title">4. Confirm Your Character</h3>

              <div className="char-shop-confirm-card">
                <img
                  src={selectedType.image}
                  alt={selectedType.name}
                  className="char-shop-confirm-image"
                />
                <div className="char-shop-confirm-details">
                  <div className="char-shop-confirm-row">
                    <span className="char-shop-confirm-label">Name:</span>
                    <span className="char-shop-confirm-value">{characterName}</span>
                  </div>
                  <div className="char-shop-confirm-row">
                    <span className="char-shop-confirm-label">Type:</span>
                    <span className="char-shop-confirm-value">{selectedType.name}</span>
                  </div>
                  <div className="char-shop-confirm-row">
                    <span className="char-shop-confirm-label">Room:</span>
                    <span className="char-shop-confirm-value">
                      ({selectedRoom.x}, {selectedRoom.y}, {selectedRoom.z})
                    </span>
                  </div>
                  <div className="char-shop-confirm-row">
                    <span className="char-shop-confirm-label">Price:</span>
                    <span className="char-shop-confirm-value char-shop-confirm-price">
                      {formattedPrice} LYX
                    </span>
                  </div>
                </div>
              </div>

              {mintError && (
                <div className="char-shop-error">
                  <AlertCircle size={16} />
                  <span>{mintError}</span>
                </div>
              )}

              <button
                className="char-shop-mint-btn char-shop-mint-btn--confirm"
                onClick={handleMint}
              >
                <Wallet size={18} />
                <span>MINT CHARACTER FOR {formattedPrice} LYX</span>
              </button>

              <p className="char-shop-confirm-note">
                You'll receive 50 free starting blocks for each basic block type!
              </p>
            </div>
          )}

          {/* Minting in Progress */}
          {step === STEPS.MINTING && (
            <div className="char-shop-minting">
              <Loader2 size={48} className="animate-spin char-shop-minting-spinner" />
              <h3 className="char-shop-minting-title">Minting Your Character...</h3>
              <p className="char-shop-minting-text">
                Please confirm the transaction in your wallet.
                <br />
                This may take a few moments.
              </p>
            </div>
          )}

          {/* Success */}
          {step === STEPS.SUCCESS && (
            <div className="char-shop-success">
              <div className="char-shop-success-icon">🎉</div>
              <h3 className="char-shop-success-title">Character Minted!</h3>
              <p className="char-shop-success-text">
                Welcome to Block Quest, <strong>{characterName}</strong>!
                <br />
                Your room at ({selectedRoom?.x}, {selectedRoom?.y}, {selectedRoom?.z}) is now yours.
              </p>
              <button className="char-shop-mint-btn" onClick={onClose}>
                <span>ENTER THE GAME</span>
              </button>
            </div>
          )}
        </div>

        {/* Bonus Info Card - only show on first step */}
        {isConnected && step === STEPS.SELECT_TYPE && (
          <div className="char-shop-bonus-card">
            <div className="char-shop-bonus-badge">🎁 BONUS</div>
            <div className="char-shop-bonus-content">
              <p className="char-shop-bonus-title">Each character comes with a PRIVATE ROOM + STARTING BLOCKS</p>
              <p className="char-shop-bonus-text">
                Only YOU can place and modify blocks in your room. You'll receive 50 of each basic block type to start building!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

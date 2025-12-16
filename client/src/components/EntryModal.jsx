import { useState } from "react";
import { User, Wallet, X, Loader2, AlertCircle } from "lucide-react";
import { useWallet } from "../context/WalletContext";

export default function EntryModal({ isOpen, onClose, onGuestEntry, onWalletConnected }) {
  const { connect, isConnecting, error: walletError } = useWallet();
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleGuestEntry = () => {
    onGuestEntry();
  };

  const handleWalletConnect = async () => {
    setError(null);
    try {
      const address = await connect();
      if (address) {
        onWalletConnected(address);
      }
    } catch (e) {
      setError(e.message || "Failed to connect wallet");
    }
  };

  const displayError = error || walletError;

  return (
    <div className="entry-modal-overlay">
      {/* Backdrop */}
      <div className="entry-modal-backdrop" onClick={onClose} />

      {/* Modal Container */}
      <div className="entry-modal-container">
        {/* Scanline effect */}
        <div className="entry-modal-scanlines" />

        {/* Close button */}
        <button className="entry-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        {/* Header */}
        <div className="entry-modal-header">
          <h2 className="entry-modal-title">CHOOSE YOUR PATH</h2>
          <p className="entry-modal-subtitle">
            Enter the Block Quest dimension
          </p>
        </div>

        {/* Options */}
        <div className="entry-modal-options">
          {/* Guest Option */}
          <button
            className="entry-modal-option entry-modal-option--guest"
            onClick={handleGuestEntry}
          >
            <div className="entry-modal-option-icon">
              <User size={32} />
            </div>
            <div className="entry-modal-option-content">
              <span className="entry-modal-option-title">ENTER AS GUEST</span>
              <span className="entry-modal-option-desc">
                Explore the world without an account
              </span>
            </div>
            <div className="entry-modal-option-arrow">→</div>
          </button>

          {/* Divider */}
          <div className="entry-modal-divider">
            <span>OR</span>
          </div>

          {/* Wallet Option */}
          <button
            className="entry-modal-option entry-modal-option--wallet"
            onClick={handleWalletConnect}
            disabled={isConnecting}
          >
            <div className="entry-modal-option-icon">
              {isConnecting ? (
                <Loader2 size={32} className="animate-spin" />
              ) : (
                <Wallet size={32} />
              )}
            </div>
            <div className="entry-modal-option-content">
              <span className="entry-modal-option-title">
                {isConnecting ? "CONNECTING..." : "CONNECT WALLET"}
              </span>
              <span className="entry-modal-option-desc">
                Link your Universal Profile to save progress
              </span>
            </div>
            <div className="entry-modal-option-arrow">→</div>
          </button>
        </div>

        {/* Error Display */}
        {displayError && (
          <div className="entry-modal-error">
            <AlertCircle size={16} />
            <span>{displayError}</span>
          </div>
        )}

        {/* Info Banner */}
        <div className="entry-modal-info">
          <div className="entry-modal-info-item">
            <span className="entry-modal-info-label">GUEST</span>
            <span className="entry-modal-info-value">Random spawn • Tutorial included</span>
          </div>
          <div className="entry-modal-info-divider">|</div>
          <div className="entry-modal-info-item">
            <span className="entry-modal-info-label">WALLET</span>
            <span className="entry-modal-info-value">Own rooms • Save progress • NFT characters</span>
          </div>
        </div>
      </div>
    </div>
  );
}


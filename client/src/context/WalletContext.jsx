import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [address, setAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Get the UP provider from window.lukso (injected by UP Browser Extension)
  const getProvider = useCallback(() => {
    if (typeof window !== "undefined" && window.lukso) {
      return window.lukso;
    }
    return null;
  }, []);

  // Initialize provider and check for existing connection
  useEffect(() => {
    const initProvider = async () => {
      try {
        const upProvider = getProvider();
        if (upProvider) {
          setProvider(upProvider);

          // Check for existing connection from localStorage
          const savedAddress = localStorage.getItem("walletAddress");
          if (savedAddress) {
            // Verify the connection is still valid
            try {
              const accounts = await upProvider.request({
                method: "eth_accounts",
              });
              if (accounts && accounts.length > 0) {
                setAddress(accounts[0]);
                setIsConnected(true);
              } else {
                // Clear stale data
                localStorage.removeItem("walletAddress");
              }
            } catch (e) {
              console.warn("Could not verify saved wallet connection:", e);
              localStorage.removeItem("walletAddress");
            }
          }
        }
      } catch (e) {
        console.error("Failed to initialize UP provider:", e);
      }
    };

    initProvider();
  }, [getProvider]);

  // Connect wallet
  const connect = useCallback(async () => {
    setError(null);
    setIsConnecting(true);

    try {
      // Check if UP extension is available
      const upProvider = getProvider();
      if (!upProvider) {
        throw new Error(
          "Universal Profile extension not found. Please install the UP Browser Extension."
        );
      }

      setProvider(upProvider);

      // Request account access
      const accounts = await upProvider.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found. Please connect your Universal Profile.");
      }

      const connectedAddress = accounts[0];
      setAddress(connectedAddress);
      setIsConnected(true);

      // Persist connection
      localStorage.setItem("walletAddress", connectedAddress);

      return connectedAddress;
    } catch (e) {
      console.error("Wallet connection error:", e);
      setError(e.message || "Failed to connect wallet");
      throw e;
    } finally {
      setIsConnecting(false);
    }
  }, [getProvider]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setAddress(null);
    setIsConnected(false);
    setError(null);
    localStorage.removeItem("walletAddress");
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (!provider) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAddress(accounts[0]);
        localStorage.setItem("walletAddress", accounts[0]);
      }
    };

    const handleChainChanged = () => {
      // Reload on chain change to reset state
      window.location.reload();
    };

    provider.on?.("accountsChanged", handleAccountsChanged);
    provider.on?.("chainChanged", handleChainChanged);

    return () => {
      provider.removeListener?.("accountsChanged", handleAccountsChanged);
      provider.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [provider, disconnect]);

  const value = {
    provider,
    address,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};


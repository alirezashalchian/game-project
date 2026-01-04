import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type PublicClient,
  type WalletClient,
  type Transport,
  type Chain,
  type Address,
} from "viem";
import { useWallet } from "./WalletContext";
import { luksoMainnet, CONTRACTS } from "../contracts/config";
import {
  characterNFTAbi,
  blockTypeRegistryAbi,
} from "../contracts/abis";

/**
 * Contract instances type for type-safe access
 */
interface ContractInstances {
  characterNFT: {
    address: Address;
    abi: typeof characterNFTAbi;
  };
  blockTypeRegistry: {
    address: Address;
    abi: typeof blockTypeRegistryAbi;
  };
}

/**
 * Context value type
 */
interface ContractsContextValue {
  /** Public client for read-only operations (always available) */
  publicClient: PublicClient<Transport, Chain>;
  /** Wallet client for write operations (only when wallet connected) */
  walletClient: WalletClient<Transport, Chain> | null;
  /** Connected address from wallet */
  address: Address | null;
  /** Whether wallet is connected */
  isConnected: boolean;
  /** Contract instances with addresses and ABIs */
  contracts: ContractInstances;
  /** Current chain */
  chain: Chain;
}

const ContractsContext = createContext<ContractsContextValue | null>(null);

/**
 * Hook to access the contracts context
 * @throws Error if used outside of ContractsProvider
 */
export function useContracts(): ContractsContextValue {
  const context = useContext(ContractsContext);
  if (!context) {
    throw new Error("useContracts must be used within a ContractsProvider");
  }
  return context;
}

interface ContractsProviderProps {
  children: ReactNode;
}

/**
 * Provider component that wraps WalletContext and provides viem clients
 * for interacting with LUKSO smart contracts.
 * 
 * The public client is always available for read operations.
 * The wallet client is only available when a wallet is connected.
 */
export function ContractsProvider({ children }: ContractsProviderProps) {
  const { provider, address, isConnected } = useWallet();

  // Create public client for read-only operations (always available)
  const publicClient = useMemo(() => {
    return createPublicClient({
      chain: luksoMainnet,
      transport: http(),
    });
  }, []);

  // Create wallet client for write operations (only when wallet is connected)
  const walletClient = useMemo(() => {
    if (!provider || !isConnected) {
      return null;
    }

    return createWalletClient({
      chain: luksoMainnet,
      transport: custom(provider),
    });
  }, [provider, isConnected]);

  // Contract instances with addresses and ABIs
  const contracts: ContractInstances = useMemo(
    () => ({
      characterNFT: {
        address: CONTRACTS.characterNFT as Address,
        abi: characterNFTAbi,
      },
      blockTypeRegistry: {
        address: CONTRACTS.blockTypeRegistry as Address,
        abi: blockTypeRegistryAbi,
      },
    }),
    []
  );

  const value: ContractsContextValue = useMemo(
    () => ({
      publicClient,
      walletClient,
      address: address as Address | null,
      isConnected,
      contracts,
      chain: luksoMainnet,
    }),
    [publicClient, walletClient, address, isConnected, contracts]
  );

  return (
    <ContractsContext.Provider value={value}>
      {children}
    </ContractsContext.Provider>
  );
}


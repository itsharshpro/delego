import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import * as fcl from '@onflow/fcl';

interface FlowUser {
  addr: string | null;
  cid: string | null;
  loggedIn: boolean | null;
  [key: string]: unknown;
}

interface WalletContextType {
  user: FlowUser | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  loading: boolean;
  isDemoMode: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Demo address for fallback connection
const DEMO_ADDRESS = '0x1635dff04f103087';

export function WalletProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FlowUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [connectionTimeout, setConnectionTimeout] = useState<number | null>(null);

  useEffect(() => {
    // Initialize FCL
    fcl.config({
      'accessNode.api': 'https://rest-testnet.onflow.org',
      'discovery.wallet': 'https://fcl-discovery.onflow.org/testnet/authn',
      'app.detail.title': 'Delego',
      'app.detail.icon': 'https://delego.app/icon.png',
    });

    // Subscribe to user changes with proper type handling
    fcl.currentUser.subscribe((currentUser) => {
      setUser({
        addr: currentUser.addr || null,
        cid: currentUser.cid || null,
        loggedIn: currentUser.loggedIn || null,
        ...currentUser
      });
    });
  }, []);

  const connectWithFallback = async () => {
    setLoading(true);
    
    // Set up 10-second timeout for demo mode fallback
    const timeout = window.setTimeout(() => {
      console.log('Wallet connection timeout - switching to demo mode');
      setIsDemoMode(true);
      setUser({
        addr: DEMO_ADDRESS,
        cid: null,
        loggedIn: true
      });
      setLoading(false);
    }, 10000); // 10 seconds
    
    setConnectionTimeout(timeout);

    try {
      // Use the actual FCL authentication (real Flow wallet popup)
      await fcl.authenticate();
      
      // If authentication succeeds, clear the timeout and demo mode
      if (connectionTimeout) {
        window.clearTimeout(connectionTimeout);
      }
      window.clearTimeout(timeout);
      setConnectionTimeout(null);
      setIsDemoMode(false);
      setLoading(false);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      // If authentication fails immediately, let timeout handle demo mode
    }
  };



  const disconnect = async () => {
    setLoading(true);
    
    // Clear any pending timeout
    if (connectionTimeout) {
      window.clearTimeout(connectionTimeout);
      setConnectionTimeout(null);
    }
    
    try {
      if (isDemoMode) {
        // Just reset demo mode
        setIsDemoMode(false);
        setUser(null);
      } else {
        await fcl.unauthenticate();
      }
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (connectionTimeout) {
        window.clearTimeout(connectionTimeout);
      }
    };
  }, [connectionTimeout]);

  const value: WalletContextType = {
    user,
    isConnected: !!user?.addr,
    connect: connectWithFallback,
    disconnect,
    loading,
    isDemoMode,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

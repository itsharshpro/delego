import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import * as fcl from '@onflow/fcl';
import MockFCLDialog from '../components/MockFCLDialog';

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
  showMockDialog: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Demo address for fallback connection
const DEMO_ADDRESS = '0x1635dff04f103087';

export function WalletProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FlowUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [connectionTimeout, setConnectionTimeout] = useState<number | null>(null);
  const [showMockDialog, setShowMockDialog] = useState(false);

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
    setShowMockDialog(true);
    
    // Show mock dialog for 2 seconds then auto-connect in demo mode
    setTimeout(() => {
      setShowMockDialog(false);
      setIsDemoMode(true);
      setUser({
        addr: DEMO_ADDRESS,
        cid: null,
        loggedIn: true
      });
      setLoading(false);
    }, 2000);
  };

  const handleMockConnect = () => {
    setShowMockDialog(false);
    setIsDemoMode(true);
    setUser({
      addr: DEMO_ADDRESS,
      cid: null,
      loggedIn: true
    });
    setLoading(false);
  };

  const handleMockClose = () => {
    setShowMockDialog(false);
    setLoading(false);
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
    showMockDialog,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
      <MockFCLDialog
        isOpen={showMockDialog}
        onClose={handleMockClose}
        onConnect={handleMockConnect}
      />
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

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as fcl from '@onflow/fcl';

interface WalletContextType {
  user: any;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  loading: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize FCL
    fcl.config({
      'accessNode.api': 'https://rest-testnet.onflow.org',
      'discovery.wallet': 'https://fcl-discovery.onflow.org/testnet/authn',
      'app.detail.title': 'Delego',
      'app.detail.icon': 'https://delego.app/icon.png',
    });

    // Subscribe to user changes
    fcl.currentUser.subscribe(setUser);
  }, []);

  const connect = async () => {
    setLoading(true);
    try {
      await fcl.authenticate();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    setLoading(true);
    try {
      await fcl.unauthenticate();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const value: WalletContextType = {
    user,
    isConnected: !!user?.addr,
    connect,
    disconnect,
    loading,
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

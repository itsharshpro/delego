import React, { createContext, useContext, useState, ReactNode } from 'react';
import * as fcl from '@onflow/fcl';

interface FlowContextType {
  network: 'testnet' | 'mainnet';
  contractAddresses: {
    FlowPassNFT?: string;
    DelegationNFT?: string;
    SelfAttestationRegistry?: string;
  };
  executeTransaction: (cadence: string, args?: any[]) => Promise<any>;
  getAccount: (address: string) => Promise<any>;
  setNetwork: (network: 'testnet' | 'mainnet') => void;
  updateContractAddresses: (addresses: any) => void;
}

const FlowContext = createContext<FlowContextType | undefined>(undefined);

export function FlowProvider({ children }: { children: ReactNode }) {
  const [network, setNetworkState] = useState<'testnet' | 'mainnet'>('testnet');
  const [contractAddresses, setContractAddresses] = useState({
    FlowPassNFT: undefined,
    DelegationNFT: undefined,
    SelfAttestationRegistry: undefined,
  });

  const setNetwork = (newNetwork: 'testnet' | 'mainnet') => {
    setNetworkState(newNetwork);
    // Reconfigure FCL for new network
    const config = {
      testnet: {
        accessNode: 'https://rest-testnet.onflow.org',
        discoveryWallet: 'https://fcl-discovery.onflow.org/testnet/authn',
      },
      mainnet: {
        accessNode: 'https://rest-mainnet.onflow.org',
        discoveryWallet: 'https://fcl-discovery.onflow.org/authn',
      },
    };

    fcl.config({
      'accessNode.api': config[newNetwork].accessNode,
      'discovery.wallet': config[newNetwork].discoveryWallet,
    });
  };

  const updateContractAddresses = (addresses: any) => {
    setContractAddresses(prev => ({ ...prev, ...addresses }));
  };

  const executeTransaction = async (cadence: string, args: any[] = []) => {
    try {
      const transactionId = await fcl.mutate({
        cadence,
        args: (arg, t) => args,
        payer: fcl.authz,
        proposer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 999,
      });

      console.log('Transaction submitted:', transactionId);

      // Wait for transaction to be sealed
      const transaction = await fcl.tx(transactionId).onceSealed();
      console.log('Transaction sealed:', transaction);

      return transaction;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  };

  const getAccount = async (address: string) => {
    try {
      const account = await fcl.account(address);
      return account;
    } catch (error) {
      console.error('Failed to get account:', error);
      throw error;
    }
  };

  const value: FlowContextType = {
    network,
    contractAddresses,
    executeTransaction,
    getAccount,
    setNetwork,
    updateContractAddresses,
  };

  return (
    <FlowContext.Provider value={value}>
      {children}
    </FlowContext.Provider>
  );
}

export function useFlow() {
  const context = useContext(FlowContext);
  if (context === undefined) {
    throw new Error('useFlow must be used within a FlowProvider');
  }
  return context;
}

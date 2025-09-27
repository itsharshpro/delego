import React from 'react';
import { Wallet, LogOut, User } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';

const WalletConnect: React.FC = () => {
  const { user, isConnected, connect, disconnect, loading } = useWallet();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <button
        onClick={connect}
        disabled={loading}
        className="btn-primary flex items-center space-x-2 disabled:opacity-50"
      >
        <Wallet className="w-5 h-5" />
        <span>{loading ? 'Connecting...' : 'Connect Wallet'}</span>
      </button>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2 bg-gray-800 px-4 py-2 rounded-lg">
        <User className="w-4 h-4 text-green-400" />
        <span className="text-white font-mono text-sm">
          {formatAddress(user.addr)}
        </span>
      </div>

      <button
        onClick={disconnect}
        className="btn-secondary flex items-center space-x-2"
      >
        <LogOut className="w-4 h-4" />
        <span>Disconnect</span>
      </button>
    </div>
  );
};

export default WalletConnect;

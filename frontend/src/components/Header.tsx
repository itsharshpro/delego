import React from 'react';
import { Share2 } from 'lucide-react';
import WalletConnect from './WalletConnect';

const Header: React.FC = () => {

  return (
    <header className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-b border-gray-800/50 px-6 py-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Delego
            </h1>
            <p className="text-xs text-gray-400">Share & Rent Subscriptions</p>
          </div>
          

        </div>
        
        <WalletConnect />
      </div>
    </header>
  );
};

export default Header;

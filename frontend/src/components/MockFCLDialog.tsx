import React, { useState } from 'react';
import { X, Wallet } from 'lucide-react';

interface MockFCLDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
}

const MockFCLDialog: React.FC<MockFCLDialogProps> = ({ isOpen, onClose, onConnect }) => {
  const [selectedWallet, setSelectedWallet] = useState<string>('');

  const wallets = [
    { name: 'Lilico', icon: '🌸', description: 'Browser extension wallet' },
    { name: 'Blocto', icon: '🔵', description: 'Cross-platform wallet' },
    { name: 'Dapper', icon: '💎', description: 'Self-custody wallet' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Connect to Flow</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          {wallets.map((wallet) => (
            <button
              key={wallet.name}
              onClick={() => setSelectedWallet(wallet.name)}
              className={`w-full p-4 rounded-xl border transition-all flex items-center space-x-3 ${
                selectedWallet === wallet.name
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
              }`}
            >
              <span className="text-2xl">{wallet.icon}</span>
              <div className="text-left">
                <div className="font-semibold text-white">{wallet.name}</div>
                <div className="text-sm text-gray-400">{wallet.description}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConnect}
            disabled={!selectedWallet}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all"
          >
            Connect
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Powered by Flow Client Library (FCL)
          </p>
        </div>
      </div>
    </div>
  );
};

export default MockFCLDialog;

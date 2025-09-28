import React from 'react';
import { X, AlertCircle, Clock, Zap, CheckCircle } from 'lucide-react';

interface TransactionConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  transactionType: 'mint' | 'rent' | 'delegate';
  details: {
    service?: string;
    amount?: string;
    duration?: string;
    recipient?: string;
    subscriptionName?: string;
  };
  loading?: boolean;
}

const TransactionConfirmDialog: React.FC<TransactionConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  transactionType,
  details,
  loading = false
}) => {
  if (!isOpen) return null;

  const getTransactionTitle = () => {
    switch (transactionType) {
      case 'mint': return 'Share Subscription';
      case 'rent': return 'Rent Subscription';
      case 'delegate': return 'Delegate Access';
      default: return 'Confirm Transaction';
    }
  };

  const getTransactionDescription = () => {
    switch (transactionType) {
      case 'mint':
        return `Create and list your ${details.service} subscription on the marketplace`;
      case 'rent':
        return `Rent ${details.subscriptionName} for ${details.duration}`;
      case 'delegate':
        return `Grant temporary access to ${details.recipient}`;
      default:
        return 'Please confirm this transaction';
    }
  };

  const getGasFee = () => {
    // Simulate realistic Flow transaction fees
    const fees = {
      mint: '0.001',
      rent: '0.0005',
      delegate: '0.0003'
    };
    return fees[transactionType] || '0.001';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-md w-full border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{getTransactionTitle()}</h2>
              <p className="text-sm text-gray-400">Flow Transaction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Transaction Details */}
        <div className="p-6 space-y-4">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-sm text-gray-300 mb-2">Transaction Details</p>
            <p className="text-white font-medium">{getTransactionDescription()}</p>
          </div>

          {details.amount && (
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Amount</span>
              <span className="text-white font-mono">{details.amount} FLOW</span>
            </div>
          )}

          {details.duration && (
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Duration</span>
              <span className="text-white">{details.duration}</span>
            </div>
          )}

          <div className="border-t border-gray-800 pt-4">
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Network Fee</span>
              <span className="text-white font-mono">{getGasFee()} FLOW</span>
            </div>
            
            {details.amount && (
              <div className="flex justify-between items-center py-2 border-t border-gray-700 mt-2 pt-2">
                <span className="text-white font-medium">Total</span>
                <span className="text-white font-mono font-bold">
                  {(parseFloat(details.amount) + parseFloat(getGasFee())).toFixed(4)} FLOW
                </span>
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-blue-300 text-sm font-medium">Secure Transaction</p>
              <p className="text-blue-200 text-xs mt-1">
                This transaction will be executed on Flow blockchain and cannot be reversed.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors border border-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirm</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Flow Branding */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
            <div className="w-4 h-4 bg-gradient-to-br from-green-400 to-blue-500 rounded-full"></div>
            <span>Powered by Flow Blockchain</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionConfirmDialog;

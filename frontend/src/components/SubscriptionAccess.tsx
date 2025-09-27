import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Clock, Users } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';

const SubscriptionAccess: React.FC = () => {
  const { user } = useWallet();
  const [accessStatus, setAccessStatus] = useState<'checking' | 'granted' | 'denied'>('checking');
  const [delegationInfo, setDelegationInfo] = useState<any>(null);
  const [subscriptionContent, setSubscriptionContent] = useState<string | null>(null);

  useEffect(() => {
    // Simulate checking access based on delegation or direct ownership
    const checkAccess = async () => {
      // In a real app, this would verify NFT ownership or active delegation
      setTimeout(() => {
        // Mock: check URL params for delegation
        const urlParams = new URLSearchParams(window.location.search);
        const delegationId = urlParams.get('delegation');

        if (delegationId) {
          // Mock delegation access
          setDelegationInfo({
            id: delegationId,
            passId: 1,
            expiresAt: Date.now() + (24 * 60 * 60 * 1000),
            creator: '0x1234567890abcdef'
          });
          setAccessStatus('granted');
          setSubscriptionContent("Welcome to your delegated premium content! This access is time-limited.");
        } else if (user?.addr) {
          // Mock direct ownership
          setAccessStatus('granted');
          setSubscriptionContent("Welcome to your premium subscription content! You have full access.");
        } else {
          setAccessStatus('denied');
        }
      }, 1500);
    };

    checkAccess();
  }, [user]);

  const formatTimeRemaining = (expiresAt: number) => {
    if (!expiresAt) return '';

    const remaining = expiresAt - Date.now();
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (remaining <= 0) return 'Expired';
    return `${hours}h ${minutes}m remaining`;
  };

  if (accessStatus === 'checking') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="card-title mb-2">Verifying Access</h2>
          <p className="text-gray-400">
            Checking your subscription and delegation status...
          </p>
        </div>
      </div>
    );
  }

  if (accessStatus === 'denied') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="w-16 h-16 text-red-400" />
          </div>
          <h2 className="card-title mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-6">
            You don't have access to this premium content. You need a valid FlowPass NFT or delegation.
          </p>

          <div className="space-y-3">
            <a href="/mint" className="btn-primary w-full block">
              Mint a FlowPass NFT
            </a>
            <p className="text-sm text-gray-500">
              Or ask someone to delegate their subscription to you
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <div className="card-header">
          <Shield className="w-8 h-8 text-green-400 mb-2" />
          <h1 className="card-title">Premium Content Access</h1>
          <p className="card-description">
            Welcome to your exclusive subscription content
          </p>
        </div>

        {/* Access Status */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <span className="text-green-400 font-medium">Access Granted</span>
          </div>

          {delegationInfo && (
            <div className="flex items-center space-x-2 bg-blue-900/20 border border-blue-800 rounded-lg px-4 py-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-blue-300 text-sm">
                Delegated Access
              </span>
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300 text-sm">
                {formatTimeRemaining(delegationInfo.expiresAt)}
              </span>
            </div>
          )}
        </div>

        {/* Premium Content */}
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-800/50 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">🎯 Exclusive Content</h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 leading-relaxed">
                {subscriptionContent}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">Premium Features</h3>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Early access to new content</li>
                    <li>• Ad-free experience</li>
                    <li>• Priority customer support</li>
                    <li>• Exclusive community access</li>
                  </ul>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">Your Subscription</h3>
                  <div className="text-sm text-gray-400 space-y-1">
                    <div>Status: <span className="text-green-400">Active</span></div>
                    <div>Type: {delegationInfo ? 'Delegated Access' : 'Direct Ownership'}</div>
                    {delegationInfo && (
                      <div>Expires: {new Date(delegationInfo.expiresAt).toLocaleString()}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mock Content Sections */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors cursor-pointer">
              <h3 className="font-semibold text-white mb-2">📚 Learning Resources</h3>
              <p className="text-sm text-gray-400">Access exclusive tutorials and guides</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors cursor-pointer">
              <h3 className="font-semibold text-white mb-2">🎮 Interactive Tools</h3>
              <p className="text-sm text-gray-400">Premium tools and utilities</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors cursor-pointer">
              <h3 className="font-semibold text-white mb-2">👥 Community</h3>
              <p className="text-sm text-gray-400">Exclusive member discussions</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-800 text-center">
          <p className="text-sm text-gray-500">
            This content is protected by FlowPass NFT technology.
            {delegationInfo && ' Access provided through delegation.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionAccess;

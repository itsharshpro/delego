import React, { useEffect, useState } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { Play, Shield, CheckCircle, ExternalLink, Clock } from 'lucide-react';
import { NetflixService } from '../services/NetflixService';
import { useWallet } from '../contexts/WalletContext';

interface AccessData {
  session: {
    sessionId: string;
    expiresAt: number;
    profileName: string;
  };
  instructions: string[];
}

const NetflixAccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useWallet();
  const [accessData, setAccessData] = useState<AccessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    const validateAccess = async (token: string) => {
      try {
        setLoading(true);
        
        // Decode the token to get session info
        const tokenData = JSON.parse(atob(token));
        
        if (!tokenData.sessionId || !user?.addr) {
          throw new Error('Invalid token or user not authenticated');
        }

        // Use NetflixService to validate and get session
        const sessionResult = await NetflixService.useSession(tokenData.sessionId, user.addr);
        
        if (!sessionResult.success) {
          throw new Error(sessionResult.error || 'Session validation failed');
        }

        setAccessData({
          session: {
            sessionId: tokenData.sessionId,
            expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
            profileName: sessionResult.profileAccess?.profileName || 'Renter Profile'
          },
          instructions: sessionResult.profileAccess?.instructions || []
        });

      } catch (err) {
        console.error('Access validation failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to validate access');
      } finally {
        setLoading(false);
      }
    };

    const token = searchParams.get('token');
    if (!token || !user?.addr) {
      setError('Invalid access token or user not authenticated');
      setLoading(false);
      return;
    }

    validateAccess(token);
  }, [searchParams, user]);

  useEffect(() => {
    if (accessData?.session?.expiresAt) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, accessData.session.expiresAt - Date.now());
        setTimeRemaining(remaining);
        
        if (remaining === 0) {
          setError('Session has expired');
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [accessData]);

  const openNetflix = () => {
    // Open Netflix in a new tab
    window.open('https://www.netflix.com', '_blank');
  };

  const formatTimeRemaining = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (!user?.addr) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[rgb(8,8,8)] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-red-500 border-t-transparent mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Validating Netflix Access</h2>
          <p className="text-gray-400">Please wait while we secure your session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[rgb(8,8,8)] text-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="p-4 bg-red-900/20 border border-red-600/30 rounded-xl mb-6">
            <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-400 mb-2">Access Denied</h2>
            <p className="text-gray-300">{error}</p>
          </div>
          <button
            onClick={() => window.close()}
            className="btn-secondary"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[rgb(8,8,8)] to-red-900/20 text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="p-4 bg-gradient-to-br from-red-600 to-red-500 rounded-2xl inline-block mb-4">
              <Play className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Netflix Access Ready</h1>
            <p className="text-gray-400">Your secure Netflix session has been created</p>
          </div>

          {/* Access Card */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-8 border border-gray-700/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <div>
                  <h3 className="text-lg font-semibold text-green-400">Session Active</h3>
                  <p className="text-sm text-gray-400">Profile: {accessData?.session?.profileName}</p>
                </div>
              </div>
              
              {timeRemaining > 0 && (
                <div className="text-right">
                  <div className="flex items-center space-x-2 text-orange-400 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="font-mono text-lg">{formatTimeRemaining(timeRemaining)}</span>
                  </div>
                  <p className="text-xs text-gray-400">remaining</p>
                </div>
              )}
            </div>

            {/* Security Notice */}
            <div className="bg-blue-900/20 border border-blue-600/30 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-5 h-5 text-blue-400" />
                <span className="text-blue-400 font-medium">Privacy Protected</span>
              </div>
              <p className="text-gray-300 text-sm">
                Your access is completely secure. The owner's credentials remain private, 
                and your session will automatically expire when your rental period ends.
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
              <h4 className="font-medium text-white mb-3">How to Access Netflix:</h4>
              <ol className="text-sm text-gray-300 space-y-2">
                <li className="flex items-start space-x-3">
                  <span className="text-red-400 font-bold">1.</span>
                  <span>Click the "Open Netflix" button below</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-red-400 font-bold">2.</span>
                  <span>Look for your profile: "{accessData?.session?.profileName}"</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-red-400 font-bold">3.</span>
                  <span>Select your profile and start streaming</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-red-400 font-bold">4.</span>
                  <span>Your access will expire automatically - no logout needed</span>
                </li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={openNetflix}
                className="flex-1 btn-primary bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 flex items-center justify-center space-x-2 py-4"
              >
                <ExternalLink className="w-5 h-5" />
                <span className="font-semibold">Open Netflix</span>
              </button>
              
              <button
                onClick={() => window.close()}
                className="btn-secondary px-6"
              >
                Close
              </button>
            </div>

            {/* Additional Info */}
            <div className="mt-6 pt-6 border-t border-gray-700/50">
              <div className="flex items-center justify-between text-sm">
                <div className="text-gray-400">
                  Session ID: {accessData?.session?.sessionId?.slice(-8)}
                </div>
                <div className="text-gray-400">
                  Expires: {accessData?.session?.expiresAt ? new Date(accessData.session.expiresAt).toLocaleString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetflixAccessPage;

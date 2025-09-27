import React, { useState, useEffect } from 'react';
import { Play, Clock, Shield, ExternalLink, User, Lock, CheckCircle } from 'lucide-react';
import { NetflixService } from '../services/NetflixService';
import { useWallet } from '../contexts/WalletContext';

interface NetflixAccessProps {
  subscriptionId: string;
  isOwner: boolean;
  isRenter: boolean;
  rentalEndTime?: number;
  netflixPlan: {
    name: string;
    maxScreens: number;
    hasUltraHD: boolean;
  };
}

interface SessionData {
  session: {
    sessionId: string;
    profileName?: string;
    expiresAt: number;
  };
  instructions: {
    instructions: string[];
    loginUrl: string;
    profileAccess: {
      profileName: string;
      profileId: string;
    };
  };
}

const NetflixAccess: React.FC<NetflixAccessProps> = ({
  subscriptionId: _subscriptionId,
  isOwner,
  isRenter,
  rentalEndTime,
  netflixPlan
}) => {
  const { user } = useWallet();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [accessGranted, setAccessGranted] = useState(false);

  useEffect(() => {
    if (rentalEndTime) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, rentalEndTime - Date.now());
        setTimeRemaining(remaining);
        
        if (remaining === 0 && sessionData) {
          // Cleanup expired session
          setSessionData(null);
          setAccessGranted(false);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [rentalEndTime, sessionData]);

  const formatTimeRemaining = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const createNetflixSession = async () => {
    if (!user?.addr) return;

    setLoading(true);
    setError(null);

    try {
      // Create a temporary Netflix profile session
      const session = await NetflixService.createTemporaryProfile(
        { email: 'dummy@email.com', password: 'dummy' }, // This would be fetched securely
        user.addr,
        timeRemaining || 24 * 60 * 60 * 1000 // Default 24 hours
      );

      const instructions = NetflixService.generateAccessInstructions(session);
      setSessionData({ session, instructions });
      setAccessGranted(true);

      // Clean up expired sessions
      NetflixService.cleanupExpiredSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create Netflix session');
    } finally {
      setLoading(false);
    }
  };

  const openNetflix = () => {
    if (isOwner) {
      // Owner gets direct access
      window.open('https://netflix.com', '_blank');
    } else if (sessionData) {
      // Renter gets access through secure session
      window.open(sessionData.instructions.loginUrl, '_blank');
    }
  };

  if (!isOwner && !isRenter) {
    return (
      <div className="bg-red-900/20 border border-red-600/30 rounded-xl p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Lock className="w-5 h-5 text-red-400" />
          <h3 className="text-lg font-semibold text-red-400">Access Denied</h3>
        </div>
        <p className="text-gray-300 mb-4">
          You need to rent this Netflix subscription to get access.
        </p>
        <button className="btn-primary bg-red-600 hover:bg-red-700" disabled>
          Rent to Access
        </button>
      </div>
    );
  }

  if (isOwner) {
    return (
      <div className="bg-gradient-to-br from-red-900/20 to-red-800/10 border border-red-600/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-red-600 rounded-lg">
              <Play className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Netflix Owner Access</h3>
              <p className="text-sm text-gray-400">Plan: {netflixPlan.name} ({netflixPlan.maxScreens} screens)</p>
            </div>
          </div>
          <div className="text-green-400 flex items-center space-x-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Owner</span>
          </div>
        </div>

        <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4 mb-4">
          <p className="text-green-400 text-sm">
            <strong>🔒 Your account is secure:</strong> Use your regular Netflix login. 
            Renters get temporary profile access without seeing your credentials.
          </p>
        </div>

        <button
          onClick={openNetflix}
          className="w-full btn-primary bg-red-600 hover:bg-red-700 flex items-center justify-center space-x-2"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Open Netflix</span>
        </button>
      </div>
    );
  }

  // Renter access
  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-600/30 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg">
            <Play className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Netflix Rental Access</h3>
            <p className="text-sm text-gray-400">Plan: {netflixPlan.name} ({netflixPlan.maxScreens} screens)</p>
          </div>
        </div>
        
        {timeRemaining > 0 && (
          <div className="text-orange-400 flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <div className="text-right">
              <div className="text-sm font-medium">{formatTimeRemaining(timeRemaining)}</div>
              <div className="text-xs text-gray-400">remaining</div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <Shield className="w-4 h-4 text-blue-400" />
          <span className="text-blue-400 font-medium text-sm">Privacy Protected</span>
        </div>
        <p className="text-gray-300 text-sm">
          You'll get secure access to Netflix through a temporary profile. 
          The owner's credentials remain completely private.
        </p>
      </div>

      {!accessGranted ? (
        <div className="text-center">
          <div className="mb-4">
            <div className="flex items-center justify-center space-x-2 text-gray-400 mb-2">
              <User className="w-5 h-5" />
              <span>Ready to create your Netflix session</span>
            </div>
            <p className="text-sm text-gray-500">
              You'll get a temporary profile that expires automatically
            </p>
          </div>
          
          <button
            onClick={createNetflixSession}
            disabled={loading || timeRemaining === 0}
            className="btn-primary bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2 mx-auto"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Creating Session...</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Get Netflix Access</span>
              </>
            )}
          </button>

          {error && (
            <p className="text-red-400 text-sm mt-3">{error}</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-medium">Session Active</span>
            </div>
            <div className="text-sm text-gray-300 space-y-1">
              <div><strong>Profile:</strong> {sessionData?.session.profileName || 'Renter Profile'}</div>
              <div><strong>Expires:</strong> {new Date(sessionData?.session.expiresAt || Date.now()).toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="font-medium text-white mb-2">How to Access Netflix:</h4>
            <ol className="text-sm text-gray-300 space-y-1">
              {sessionData?.instructions.instructions.map((instruction: string, index: number) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-purple-400 font-medium">{index + 1}.</span>
                  <span>{instruction}</span>
                </li>
              ))}
            </ol>
          </div>

          <button
            onClick={openNetflix}
            className="w-full btn-primary bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 flex items-center justify-center space-x-2"
          >
            <Play className="w-4 h-4" />
            <span>Open Netflix</span>
          </button>

          <div className="text-center">
            <p className="text-xs text-gray-400">
              Your access is secure and will expire automatically when the rental period ends.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetflixAccess;

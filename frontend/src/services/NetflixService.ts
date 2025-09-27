import CryptoJS from 'crypto-js';

interface NetflixCredentials {
  email: string;
  password: string;
}

interface NetflixSession {
  sessionId: string;
  profileId?: string;
  profileName?: string;
  expiresAt: number;
  renterAddress: string;
}

interface NetflixProfile {
  id: string;
  name: string;
  avatar: string;
  isKidsProfile: boolean;
}

export class NetflixService {
  private static readonly ENCRYPTION_KEY = import.meta.env.VITE_NETFLIX_ENCRYPTION_KEY || 'subshare-netflix-key';
  private static readonly MIN_SESSION_DURATION = 5 * 60 * 1000; // 5 minutes minimum
  private static readonly MAX_SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days maximum
  
  // Encrypt Netflix credentials for storage
  static encryptCredentials(credentials: NetflixCredentials): string {
    const dataString = JSON.stringify(credentials);
    return CryptoJS.AES.encrypt(dataString, this.ENCRYPTION_KEY).toString();
  }

  // Decrypt credentials (only for owners)
  static decryptCredentials(encryptedData: string): NetflixCredentials {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.ENCRYPTION_KEY);
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedData);
  }

  // Create a temporary Netflix profile for renter
  static async createTemporaryProfile(
    _credentials: NetflixCredentials,
    renterAddress: string,
    rentalDuration: number
  ): Promise<NetflixSession> {
    try {
      // In a real implementation, this would integrate with Netflix API
      // For demo purposes, we'll simulate profile creation
      
      const sessionId = this.generateSessionId();
      const profileName = `Renter_${renterAddress.slice(-6)}`;
      const profileId = `temp_${Date.now()}`;
      
      const session: NetflixSession = {
        sessionId,
        profileId,
        profileName,
        expiresAt: Date.now() + Math.min(rentalDuration, this.MAX_SESSION_DURATION),
        renterAddress
      };

      // Store session in localStorage (in production, use secure storage)
      const sessions = this.getSessions();
      sessions[sessionId] = session;
      localStorage.setItem('netflix_sessions', JSON.stringify(sessions));

      // Simulate Netflix profile creation
      console.log(`Creating Netflix profile: ${profileName} for renter: ${renterAddress}`);
      
      return session;
    } catch (error) {
      console.error('Failed to create Netflix profile:', error);
      throw new Error('Failed to create temporary Netflix access');
    }
  }

  // Get available Netflix profiles for account
  static async getNetflixProfiles(_credentials: NetflixCredentials): Promise<NetflixProfile[]> {
    // Simulate Netflix profiles (in real app, would call Netflix API)
    return [
      { id: 'main', name: 'Owner', avatar: '👤', isKidsProfile: false },
      { id: 'temp_1', name: 'Renter_abc123', avatar: '🎬', isKidsProfile: false },
      { id: 'temp_2', name: 'Renter_def456', avatar: '📺', isKidsProfile: false },
    ];
  }

  // Generate Netflix access instructions for renter
  static generateAccessInstructions(session: NetflixSession): {
    instructions: string[];
    loginUrl: string;
    profileAccess: {
      profileName: string;
      profileId: string;
    };
  } {
    return {
      instructions: [
        '1. Click the Netflix login link below',
        '2. The account will be automatically accessed',
        `3. Select the "${session.profileName}" profile`,
        '4. Enjoy your rental period!',
        '5. Your access will expire automatically'
      ],
      loginUrl: this.generateSecureLoginUrl(session.sessionId),
      profileAccess: {
        profileName: session.profileName || 'Renter Profile',
        profileId: session.profileId || 'temp'
      }
    };
  }

  // Generate a secure login URL that doesn't expose credentials
  private static generateSecureLoginUrl(sessionId: string): string {
    // Create a secure token that contains session info but not credentials
    const tokenData = {
      sessionId,
      timestamp: Date.now(),
      origin: 'subshare'
    };
    
    const token = btoa(JSON.stringify(tokenData));
    
    // Return a URL to our secure Netflix access page
    return `${window.location.origin}/netflix-access?token=${token}`;
  }

  // Validate and use session for Netflix access
  static async useSession(sessionId: string, renterAddress: string): Promise<{
    success: boolean;
    profileAccess?: {
      profileName: string;
      instructions: string[];
    };
    error?: string;
  }> {
    const sessions = this.getSessions();
    const session = sessions[sessionId];

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    if (session.renterAddress !== renterAddress) {
      return { success: false, error: 'Unauthorized access attempt' };
    }

    if (Date.now() > session.expiresAt) {
      // Clean up expired session
      delete sessions[sessionId];
      localStorage.setItem('netflix_sessions', JSON.stringify(sessions));
      return { success: false, error: 'Session expired' };
    }

    return {
      success: true,
      profileAccess: {
        profileName: session.profileName || 'Renter Profile',
        instructions: [
          `🎬 Welcome to Netflix!`,
          `👤 Use profile: "${session.profileName}"`,
          `⏰ Access expires: ${new Date(session.expiresAt).toLocaleString()}`,
          `🔒 Your access is secure and temporary`
        ]
      }
    };
  }

  // Clean up expired sessions
  static cleanupExpiredSessions(): void {
    const sessions = this.getSessions();
    const now = Date.now();
    
    Object.keys(sessions).forEach(sessionId => {
      if (sessions[sessionId].expiresAt < now) {
        delete sessions[sessionId];
      }
    });
    
    localStorage.setItem('netflix_sessions', JSON.stringify(sessions));
  }

  // Get all active sessions
  private static getSessions(): Record<string, NetflixSession> {
    const sessionsJson = localStorage.getItem('netflix_sessions');
    return sessionsJson ? JSON.parse(sessionsJson) : {};
  }

  // Generate unique session ID
  private static generateSessionId(): string {
    return `netflix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Revoke session (for early termination)
  static revokeSession(sessionId: string): void {
    const sessions = this.getSessions();
    delete sessions[sessionId];
    localStorage.setItem('netflix_sessions', JSON.stringify(sessions));
  }

  // Get session status
  static getSessionStatus(sessionId: string): {
    isActive: boolean;
    timeRemaining: number;
    profileName?: string;
  } {
    const sessions = this.getSessions();
    const session = sessions[sessionId];

    if (!session) {
      return { isActive: false, timeRemaining: 0 };
    }

    const timeRemaining = Math.max(0, session.expiresAt - Date.now());
    
    return {
      isActive: timeRemaining > 0,
      timeRemaining,
      profileName: session.profileName
    };
  }

  // Simulate Netflix API integration (for demo)
  static async simulateNetflixLogin(credentials: NetflixCredentials): Promise<boolean> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Basic validation (in real app, would validate with Netflix)
    if (!credentials.email.includes('@') || credentials.password.length < 6) {
      throw new Error('Invalid Netflix credentials');
    }
    
    console.log('Netflix login successful (simulated)');
    return true;
  }

  // Get Netflix subscription info (minute-based pricing for testing)
  static getNetflixPlans(): Array<{
    name: string;
    pricePerMinute: number;
    pricePerHour: number;
    pricePerDay: number;
    features: string[];
    maxProfiles: number;
  }> {
    return [
      {
        name: 'Basic',
        pricePerMinute: 0.00174, // ~2.5 FLOW per day
        pricePerHour: 0.104,     // ~2.5 FLOW per day
        pricePerDay: 2.5,
        features: ['HD streaming', '1 screen', 'Phone, tablet, computer'],
        maxProfiles: 1
      },
      {
        name: 'Standard',
        pricePerMinute: 0.00278, // ~4.0 FLOW per day
        pricePerHour: 0.167,     // ~4.0 FLOW per day
        pricePerDay: 4.0,
        features: ['Full HD streaming', '2 screens', 'Phone, tablet, computer, TV'],
        maxProfiles: 2
      },
      {
        name: 'Premium',
        pricePerMinute: 0.00451, // ~6.5 FLOW per day
        pricePerHour: 0.271,     // ~6.5 FLOW per day
        pricePerDay: 6.5,
        features: ['Ultra HD streaming', '4 screens', 'Phone, tablet, computer, TV'],
        maxProfiles: 4
      }
    ];
  }
}

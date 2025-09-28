import { createContext, useContext, useState, type ReactNode } from 'react';

interface Subscription {
  id: string;
  platform: string;
  planName: string;
  price: string;
  duration: string;
  description: string;
  features: string[];
  owner: string;
  createdAt: number;
  isActive: boolean;
  rating: number;
  totalRentals: number;
  earnings: number;
  currentRental?: {
    renter: string;
    endTime: number;
  };
}

interface SubscriptionContextType {
  subscriptions: Subscription[];
  addSubscription: (subscription: Omit<Subscription, 'id' | 'createdAt' | 'rating' | 'totalRentals' | 'earnings' | 'isActive'>) => void;
  updateSubscription: (id: string, updates: Partial<Subscription>) => void;
  getSubscriptionsByOwner: (owner: string) => Subscription[];
  getMarketplaceSubscriptions: () => Subscription[];
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([
    // Initial mock data for marketplace
    {
      id: 'demo-1',
      platform: 'Netflix',
      planName: 'Premium',
      price: '2.5',
      duration: '30',
      description: 'Netflix Premium with 4K streaming and 4 simultaneous screens',
      features: ['4K Quality', 'Multiple Profiles', 'Download Content', 'No Ads', '4 Screens'],
      owner: '0x1234567890abcdef',
      createdAt: Date.now() - 86400000, // 1 day ago
      isActive: true,
      rating: 4.8,
      totalRentals: 12,
      earnings: 30.0,
    },
    {
      id: 'demo-2',
      platform: 'Spotify',
      planName: 'Premium',
      price: '1.8',
      duration: '30',
      description: 'Spotify Premium with ad-free music and offline downloads',
      features: ['Ad-Free Music', 'Offline Downloads', 'High Quality Audio', 'Playlists'],
      owner: '0x2345678901bcdeaf',
      createdAt: Date.now() - 172800000, // 2 days ago
      isActive: true,
      rating: 4.6,
      totalRentals: 8,
      earnings: 14.4,
      currentRental: {
        renter: '0x9876543210fedcba',
        endTime: Date.now() + 12 * 60 * 60 * 1000 // 12 hours remaining
      }
    }
  ]);

  const addSubscription = (subscriptionData: Omit<Subscription, 'id' | 'createdAt' | 'rating' | 'totalRentals' | 'earnings' | 'isActive'>) => {
    const newSubscription: Subscription = {
      ...subscriptionData,
      id: `sub-${Date.now()}`,
      createdAt: Date.now(),
      isActive: true,
      rating: 0,
      totalRentals: 0,
      earnings: 0,
    };
    
    setSubscriptions(prev => [newSubscription, ...prev]);
  };

  const updateSubscription = (id: string, updates: Partial<Subscription>) => {
    setSubscriptions(prev => 
      prev.map(sub => 
        sub.id === id ? { ...sub, ...updates } : sub
      )
    );
  };

  const getSubscriptionsByOwner = (owner: string) => {
    return subscriptions.filter(sub => sub.owner === owner);
  };

  const getMarketplaceSubscriptions = () => {
    // Return all active subscriptions for the marketplace
    return subscriptions.filter(sub => sub.isActive);
  };

  const value: SubscriptionContextType = {
    subscriptions,
    addSubscription,
    updateSubscription,
    getSubscriptionsByOwner,
    getMarketplaceSubscriptions,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptions() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscriptions must be used within a SubscriptionProvider');
  }
  return context;
}

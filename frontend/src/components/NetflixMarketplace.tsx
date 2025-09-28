import React, { useState, useEffect } from 'react';
import { Play, Clock, Star, Users, Shield, Search } from 'lucide-react';
import NetflixAccess from './NetflixAccess';
import { useWallet } from '../contexts/WalletContext';
import { useSubscriptions } from '../contexts/SubscriptionContext';
import TransactionConfirmDialog from './TransactionConfirmDialog';

interface NetflixSubscription {
  id: string;
  owner: string;
  plan: {
    name: string;
    maxScreens: number;
    hasUltraHD: boolean;
    pricePerMinute: number;
    pricePerHour: number;
    pricePerDay: number;
  };
  rating: number;
  totalRatings: number;
  isActive: boolean;
  currentRental?: {
    renter: string;
    endTime: number;
  };
  earnings: number;
}

const NetflixMarketplace: React.FC = () => {
  const { user, isConnected } = useWallet();
  const [subscriptions, setSubscriptions] = useState<NetflixSubscription[]>([]);
  const [selectedSubscription, setSelectedSubscription] = useState<NetflixSubscription | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [pendingRental, setPendingRental] = useState<{
    subscription: NetflixSubscription;
    duration: number;
    unit: 'minutes' | 'hours' | 'days';
    cost: number;
  } | null>(null);

  useEffect(() => {
    loadNetflixSubscriptions();
  }, []);

  const loadNetflixSubscriptions = async () => {
    setLoading(true);
    try {
      // Mock Netflix subscriptions data (in real app, fetch from blockchain)
      const mockSubscriptions: NetflixSubscription[] = [
        {
          id: 'nft_1',
          owner: '0x1234567890abcdef',
          plan: { 
            name: 'Premium', 
            maxScreens: 4, 
            hasUltraHD: true, 
            pricePerMinute: 0.00451,
            pricePerHour: 0.271,
            pricePerDay: 6.5 
          },
          rating: 4.8,
          totalRatings: 127,
          isActive: true,
          earnings: 234.5
        },
        {
          id: 'nft_2',
          owner: '0x2345678901bcdeaf',
          plan: { 
            name: 'Standard', 
            maxScreens: 2, 
            hasUltraHD: false, 
            pricePerMinute: 0.00278,
            pricePerHour: 0.167,
            pricePerDay: 4.0 
          },
          rating: 4.6,
          totalRatings: 89,
          isActive: true,
          currentRental: {
            renter: '0x9876543210fedcba',
            endTime: Date.now() + 12 * 60 * 60 * 1000 // 12 hours remaining
          },
          earnings: 156.0
        },
        {
          id: 'nft_3',
          owner: '0x3456789012cdefab',
          plan: { 
            name: 'Basic', 
            maxScreens: 1, 
            hasUltraHD: false, 
            pricePerMinute: 0.00174,
            pricePerHour: 0.104,
            pricePerDay: 2.5 
          },
          rating: 4.3,
          totalRatings: 45,
          isActive: true,
          earnings: 87.5
        }
      ];
      setSubscriptions(mockSubscriptions);
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.plan.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = !filterPlan || sub.plan.name === filterPlan;
    return matchesSearch && matchesPlan;
  });

  const availableSubscriptions = filteredSubscriptions.filter(sub => !sub.currentRental);
  const rentedSubscriptions = filteredSubscriptions.filter(sub => sub.currentRental);

  const handleRentSubscription = async (subscription: NetflixSubscription, duration: number, unit: 'minutes' | 'hours' | 'days') => {
    if (!isConnected || !user?.addr) {
      alert('Please connect your wallet first');
      return;
    }

    // Calculate cost based on unit
    let totalCost: number;
    
    switch (unit) {
      case 'minutes':
        totalCost = subscription.plan.pricePerMinute * duration;
        break;
      case 'hours':
        totalCost = subscription.plan.pricePerHour * duration;
        break;
      case 'days':
        totalCost = subscription.plan.pricePerDay * duration;
        break;
    }

    // Set up pending rental and show transaction dialog
    setPendingRental({
      subscription,
      duration,
      unit,
      cost: totalCost
    });
    setShowTransactionDialog(true);
  };

  const handleTransactionConfirm = async () => {
    if (!pendingRental) return;
    
    setTransactionLoading(true);

    try {
      const { subscription, duration, unit, cost } = pendingRental;
      
      // Simulate blockchain transaction
      console.log(`Renting Netflix ${subscription.plan.name} for ${duration} ${unit}`);
      console.log(`Total cost: ${cost.toFixed(4)} FLOW`);
      
      // Simulate rental creation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const durationMs = unit === 'minutes' ? duration * 60 * 1000 :
                        unit === 'hours' ? duration * 60 * 60 * 1000 :
                        duration * 24 * 60 * 60 * 1000;
      
      // Update subscription with rental info
      const updatedSubs = subscriptions.map(sub => 
        sub.id === subscription.id 
          ? {
              ...sub,
              currentRental: {
                renter: user?.addr || 'demo-user',
                endTime: Date.now() + durationMs
              }
            }
          : sub
      );
      
      setSubscriptions(updatedSubs);
      setSelectedSubscription(updatedSubs.find(sub => sub.id === subscription.id) || null);
      
      // Close dialog and reset states
      setShowTransactionDialog(false);
      setPendingRental(null);
      setTransactionLoading(false);
      
      alert(`Successfully rented Netflix ${subscription.plan.name} for ${duration} ${unit}!`);
    } catch (error) {
      console.error('Rental failed:', error);
      alert('Failed to rent subscription. Please try again.');
      setTransactionLoading(false);
    }
  };

  const handleTransactionCancel = () => {
    setShowTransactionDialog(false);
    setPendingRental(null);
    setTransactionLoading(false);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
          />
        ))}
        <span className="text-sm text-gray-400 ml-1">({rating})</span>
      </div>
    );
  };

  const formatTimeRemaining = (endTime: number) => {
    const remaining = Math.max(0, endTime - Date.now());
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (selectedSubscription) {
    const isOwner = user?.addr === selectedSubscription.owner;
    const isRenter = user?.addr === selectedSubscription.currentRental?.renter;
    
    return (
      <div className="h-full overflow-auto">
        <div className="p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSelectedSubscription(null)}
            className="btn-secondary"
          >
            ← Back to Marketplace
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white">
              Netflix {selectedSubscription.plan.name}
            </h2>
            <p className="text-gray-400">
              {selectedSubscription.plan.maxScreens} screens • {selectedSubscription.plan.hasUltraHD ? 'Ultra HD' : 'HD'}
            </p>
          </div>
        </div>

        <NetflixAccess
          subscriptionId={selectedSubscription.id}
          isOwner={isOwner}
          isRenter={isRenter}
          rentalEndTime={selectedSubscription.currentRental?.endTime}
          netflixPlan={selectedSubscription.plan}
        />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
            Netflix Marketplace
          </h1>
          <p className="text-gray-400 mt-1">
            Rent Netflix subscriptions from verified owners
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="">All Plans</option>
            <option value="Basic">Basic</option>
            <option value="Standard">Standard</option>
            <option value="Premium">Premium</option>
          </select>
        </div>
      </div>

      {/* Available Subscriptions */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
          <Play className="w-5 h-5 text-green-400" />
          <span>Available Now ({availableSubscriptions.length})</span>
        </h2>
        
        {availableSubscriptions.length === 0 ? (
          <div className="bg-gray-800/50 rounded-xl p-8 text-center">
            <Play className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">No Netflix subscriptions available</h3>
            <p className="text-gray-500">Check back later or list your own subscription to share!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableSubscriptions.map((subscription) => (
              <div
                key={subscription.id}
                className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700/50 hover:border-red-500/30 transition-all duration-200 cursor-pointer"
                onClick={() => setSelectedSubscription(subscription)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-600 rounded-lg">
                      <Play className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Netflix {subscription.plan.name}</h3>
                      <p className="text-sm text-gray-400">
                        {subscription.plan.maxScreens} screens • {subscription.plan.hasUltraHD ? 'Ultra HD' : 'HD'}
                      </p>
                    </div>
                  </div>
                  <div className="text-green-400 flex items-center space-x-1">
                    <Shield className="w-4 h-4" />
                    <span className="text-xs">Verified</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center">
                      <div className="text-gray-400">Per minute</div>
                      <div className="text-white font-medium">{subscription.plan.pricePerMinute.toFixed(5)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400">Per hour</div>
                      <div className="text-white font-medium">{subscription.plan.pricePerHour.toFixed(3)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400">Per day</div>
                      <div className="text-white font-medium">{subscription.plan.pricePerDay}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Rating</span>
                    {renderStars(subscription.rating)}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Total earnings</span>
                    <span className="text-green-400 font-medium">{subscription.earnings} FLOW</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700/50">
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRentSubscription(subscription, 5, 'minutes');
                        }}
                        disabled={loading}
                        className="btn-sm btn-primary bg-green-600 hover:bg-green-700 text-xs"
                      >
                        5 min
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRentSubscription(subscription, 15, 'minutes');
                        }}
                        disabled={loading}
                        className="btn-sm btn-primary bg-green-600 hover:bg-green-700 text-xs"
                      >
                        15 min
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRentSubscription(subscription, 1, 'hours');
                        }}
                        disabled={loading}
                        className="btn-sm btn-primary bg-yellow-600 hover:bg-yellow-700 text-xs"
                      >
                        1 hour
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRentSubscription(subscription, 6, 'hours');
                        }}
                        disabled={loading}
                        className="btn-sm btn-primary bg-orange-600 hover:bg-orange-700 text-xs"
                      >
                        6 hours
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRentSubscription(subscription, 1, 'days');
                        }}
                        disabled={loading}
                        className="btn-sm btn-primary bg-red-600 hover:bg-red-700 text-xs"
                      >
                        1 day
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Currently Rented */}
      {rentedSubscriptions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-orange-400" />
            <span>Currently Rented ({rentedSubscriptions.length})</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rentedSubscriptions.map((subscription) => (
              <div
                key={subscription.id}
                className="bg-gradient-to-br from-orange-900/20 to-red-900/20 rounded-xl p-6 border border-orange-500/30 cursor-pointer"
                onClick={() => setSelectedSubscription(subscription)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-600 rounded-lg">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Netflix {subscription.plan.name}</h3>
                      <p className="text-sm text-gray-400">Currently in use</p>
                    </div>
                  </div>
                  <div className="text-orange-400 flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">
                      {subscription.currentRental && formatTimeRemaining(subscription.currentRental.endTime)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Plan</span>
                    <span className="text-white">{subscription.plan.name} • {subscription.plan.maxScreens} screens</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Rating</span>
                    {renderStars(subscription.rating)}
                  </div>
                </div>

                {user?.addr === subscription.currentRental?.renter && (
                  <div className="mt-4 pt-4 border-t border-orange-500/30">
                    <button className="w-full btn-primary bg-orange-600 hover:bg-orange-700">
                      Access Netflix
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction Confirmation Dialog */}
      <TransactionConfirmDialog
        isOpen={showTransactionDialog}
        onClose={handleTransactionCancel}
        onConfirm={handleTransactionConfirm}
        transactionType="rent"
        details={{
          subscriptionName: pendingRental ? `Netflix ${pendingRental.subscription.plan.name}` : '',
          amount: pendingRental ? pendingRental.cost.toFixed(4) : '0',
          duration: pendingRental ? `${pendingRental.duration} ${pendingRental.unit}` : '',
        }}
        loading={transactionLoading}
      />
      </div>
    </div>
  );
};

export default NetflixMarketplace;

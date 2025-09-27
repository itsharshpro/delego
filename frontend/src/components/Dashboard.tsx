import { useState } from 'react';
import { Users, DollarSign, Share, Clock, Star, ArrowRight } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';

interface Subscription {
  id: string;
  name: string;
  platform: string;
  price: number;
  duration: string;
  status: 'active' | 'rented' | 'available';
  earnings: number;
  rating: number;
  totalRentals: number;
}

interface Rental {
  id: string;
  subscription: string;
  renter: string;
  startDate: string;
  endDate: string;
  amount: number;
  status: 'active' | 'ending-soon';
}

const Dashboard = () => {
  const { isConnected } = useWallet();
  const [subscriptions] = useState<Subscription[]>([
    {
      id: '1',
      name: 'Netflix Premium',
      platform: 'Netflix',
      price: 2.5,
      duration: '30 days',
      status: 'rented',
      earnings: 15.5,
      rating: 4.8,
      totalRentals: 12
    },
    {
      id: '2', 
      name: 'Spotify Premium',
      platform: 'Spotify',
      price: 1.8,
      duration: '30 days', 
      status: 'available',
      earnings: 8.2,
      rating: 4.9,
      totalRentals: 8
    },
    {
      id: '3',
      name: 'Disney+ Premium', 
      platform: 'Disney+',
      price: 2.0,
      duration: '30 days',
      status: 'active',
      earnings: 12.0,
      rating: 4.7,
      totalRentals: 6
    }
  ]);

  const [rentals] = useState<Rental[]>([
    {
      id: '1',
      subscription: 'Netflix Premium',
      renter: '0x1234...5678',
      startDate: '2024-01-15',
      endDate: '2024-02-15',
      amount: 2.5,
      status: 'active'
    },
    {
      id: '2',
      subscription: 'Prime Video',
      renter: '0x9876...5432', 
      startDate: '2024-01-20',
      endDate: '2024-02-01',
      amount: 1.8,
      status: 'ending-soon'
    }
  ]);

  const stats = {
    totalEarnings: subscriptions.reduce((sum, sub) => sum + sub.earnings, 0),
    activeRentals: rentals.filter(r => r.status === 'active').length,
    totalSubscriptions: subscriptions.length,
    avgRating: subscriptions.reduce((sum, sub) => sum + sub.rating, 0) / subscriptions.length
  };

  if (!isConnected) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-4">Connect your wallet to start sharing and renting subscriptions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400">Manage your subscriptions and track earnings</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 p-6 rounded-2xl border border-gray-800/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Earnings</p>
                <p className="text-2xl font-bold text-white">{stats.totalEarnings.toFixed(1)} FLOW</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 p-6 rounded-2xl border border-gray-800/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Active Rentals</p>
                <p className="text-2xl font-bold text-white">{stats.activeRentals}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 p-6 rounded-2xl border border-gray-800/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Share className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Subscriptions</p>
                <p className="text-2xl font-bold text-white">{stats.totalSubscriptions}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 p-6 rounded-2xl border border-gray-800/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Star className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Avg Rating</p>
                <p className="text-2xl font-bold text-white">{stats.avgRating.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Subscriptions */}
          <div className="bg-gray-900/50 rounded-2xl border border-gray-800/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">My Subscriptions</h2>
              <button className="text-purple-400 hover:text-purple-300 transition-colors">
                View All <ArrowRight className="w-4 h-4 inline ml-1" />
              </button>
            </div>
            
            <div className="space-y-4">
              {subscriptions.slice(0, 3).map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      sub.status === 'rented' ? 'bg-yellow-400' : 
                      sub.status === 'active' ? 'bg-green-400' : 'bg-gray-400'
                    }`} />
                    <div>
                      <p className="font-medium text-white">{sub.name}</p>
                      <p className="text-sm text-gray-400">{sub.platform}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">{sub.price} FLOW/month</p>
                    <p className="text-sm text-gray-400">{sub.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Rentals */}
          <div className="bg-gray-900/50 rounded-2xl border border-gray-800/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Recent Rentals</h2>
              <button className="text-purple-400 hover:text-purple-300 transition-colors">
                View All <ArrowRight className="w-4 h-4 inline ml-1" />
              </button>
            </div>
            
            <div className="space-y-4">
              {rentals.map((rental) => (
                <div key={rental.id} className="p-4 bg-gray-800/30 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-white">{rental.subscription}</p>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      rental.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {rental.status === 'active' ? 'Active' : 'Ending Soon'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>Renter: {rental.renter}</span>
                    <span>{rental.amount} FLOW</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{rental.startDate} - {rental.endDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

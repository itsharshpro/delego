import { useState } from 'react';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, DollarSign, Clock, Star, Users, Eye, EyeOff } from 'lucide-react';

interface Subscription {
  id: string;
  name: string;
  platform: string;
  price: number;
  duration: string;
  status: 'active' | 'rented' | 'available' | 'paused';
  earnings: number;
  rating: number;
  totalRentals: number;
  currentRenter?: string;
  rentEndDate?: string;
  isVisible: boolean;
  credentials: {
    email: string;
    password: string;
  };
}

const MySubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([
    {
      id: '1',
      name: 'Netflix Premium',
      platform: 'Netflix',
      price: 2.5,
      duration: '30 days',
      status: 'rented',
      earnings: 15.5,
      rating: 4.8,
      totalRentals: 12,
      currentRenter: '0x1234...5678',
      rentEndDate: '2024-02-15',
      isVisible: true,
      credentials: {
        email: 'user@example.com',
        password: '••••••••'
      }
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
      totalRentals: 8,
      isVisible: true,
      credentials: {
        email: 'spotify@example.com',
        password: '••••••••'
      }
    },
    {
      id: '3',
      name: 'Disney+ Premium',
      platform: 'Disney+',
      price: 2.0,
      duration: '30 days',
      status: 'paused',
      earnings: 12.0,
      rating: 4.7,
      totalRentals: 6,
      isVisible: false,
      credentials: {
        email: 'disney@example.com',
        password: '••••••••'
      }
    }
  ]);

  const [showCredentials, setShowCredentials] = useState<{[key: string]: boolean}>({});

  const toggleVisibility = (id: string) => {
    setSubscriptions(prev => 
      prev.map(sub => 
        sub.id === id ? { ...sub, isVisible: !sub.isVisible } : sub
      )
    );
  };

  const toggleCredentials = (id: string) => {
    setShowCredentials(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const pauseSubscription = (id: string) => {
    setSubscriptions(prev =>
      prev.map(sub =>
        sub.id === id ? { ...sub, status: sub.status === 'paused' ? 'available' : 'paused' } : sub
      )
    );
  };

  const deleteSubscription = (id: string) => {
    if (confirm('Are you sure you want to delete this subscription?')) {
      setSubscriptions(prev => prev.filter(sub => sub.id !== id));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rented':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'available':
        return 'bg-green-500/20 text-green-400';
      case 'paused':
        return 'bg-gray-500/20 text-gray-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'rented':
        return 'Currently Rented';
      case 'available':
        return 'Available for Rent';
      case 'paused':
        return 'Paused';
      default:
        return status;
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">My Subscriptions</h1>
            <p className="text-gray-400">Manage your shared subscriptions and earnings</p>
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all">
            <Plus className="w-5 h-5" />
            <span>Add Subscription</span>
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900/50 rounded-2xl border border-gray-800/50 p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Earnings</p>
                <p className="text-2xl font-bold text-white">
                  {subscriptions.reduce((sum, sub) => sum + sub.earnings, 0).toFixed(1)} FLOW
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 rounded-2xl border border-gray-800/50 p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Active Rentals</p>
                <p className="text-2xl font-bold text-white">
                  {subscriptions.filter(sub => sub.status === 'rented').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 rounded-2xl border border-gray-800/50 p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Star className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Avg Rating</p>
                <p className="text-2xl font-bold text-white">
                  {subscriptions.length > 0 
                    ? (subscriptions.reduce((sum, sub) => sum + sub.rating, 0) / subscriptions.length).toFixed(1)
                    : '0.0'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscriptions List */}
        <div className="space-y-4">
          {subscriptions.map((subscription) => (
            <div
              key={subscription.id}
              className="bg-gray-900/50 rounded-2xl border border-gray-800/50 p-6 hover:border-purple-500/30 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{subscription.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(subscription.status)}`}>
                      {getStatusText(subscription.status)}
                    </span>
                  </div>
                  <p className="text-gray-400">{subscription.platform}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleVisibility(subscription.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      subscription.isVisible 
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                        : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                    }`}
                    title={subscription.isVisible ? 'Hide from marketplace' : 'Show in marketplace'}
                  >
                    {subscription.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => pauseSubscription(subscription.id)}
                    className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
                    title={subscription.status === 'paused' ? 'Resume' : 'Pause'}
                  >
                    {subscription.status === 'paused' ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                  </button>

                  <button
                    className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                    title="Edit subscription"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => deleteSubscription(subscription.id)}
                    className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                    title="Delete subscription"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Stats & Info */}
                <div className="space-y-4">
                  {/* Price & Duration */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Price per rental</p>
                      <p className="text-xl font-bold text-white">{subscription.price} FLOW</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Duration</p>
                      <p className="text-white">{subscription.duration}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-white">{subscription.rating}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400">{subscription.totalRentals} rentals</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <span className="text-green-400">{subscription.earnings} FLOW earned</span>
                    </div>
                  </div>

                  {/* Current Rental Info */}
                  {subscription.status === 'rented' && subscription.currentRenter && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="text-yellow-400 font-medium mb-1">Currently Rented</p>
                      <p className="text-sm text-gray-300">Renter: {subscription.currentRenter}</p>
                      {subscription.rentEndDate && (
                        <div className="flex items-center space-x-2 text-sm text-gray-400 mt-1">
                          <Clock className="w-3 h-3" />
                          <span>Ends on {subscription.rentEndDate}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Column - Credentials */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-300">Account Credentials</h4>
                    <button
                      onClick={() => toggleCredentials(subscription.id)}
                      className="text-purple-400 hover:text-purple-300 transition-colors text-sm"
                    >
                      {showCredentials[subscription.id] ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Email</label>
                      <input
                        type="text"
                        value={showCredentials[subscription.id] ? subscription.credentials.email : '••••••••••••••'}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Password</label>
                      <input
                        type="text"
                        value={showCredentials[subscription.id] ? subscription.credentials.password : '••••••••'}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white text-sm"
                      />
                    </div>
                  </div>

                  {subscription.status === 'rented' && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-red-400 text-xs font-medium">⚠️ Access Locked</p>
                      <p className="text-xs text-gray-400 mt-1">
                        You cannot use this account while it's being rented
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {subscriptions.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No subscriptions yet</h3>
            <p className="text-gray-400 mb-4">Add your first subscription to start earning</p>
            <button className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg">
              Add Subscription
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MySubscriptions;

import { useState } from 'react';
import { Eye, EyeOff, Check, AlertCircle, Upload } from 'lucide-react';
import TransactionConfirmDialog from './TransactionConfirmDialog';
import { useSubscriptions } from '../contexts/SubscriptionContext';
import { useWallet } from '../contexts/WalletContext';

interface SubscriptionForm {
  platform: string;
  planName: string;
  email: string;
  password: string;
  price: string;
  duration: string;
  category: string;
  description: string;
  features: string[];
}

const AddSubscription = () => {
  const { addSubscription } = useSubscriptions();
  const { user } = useWallet();
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [form, setForm] = useState<SubscriptionForm>({
    platform: '',
    planName: '',
    email: '',
    password: '',
    price: '',
    duration: '30',
    category: '',
    description: '',
    features: []
  });

  const platforms = [
    { id: 'netflix', name: 'Netflix', category: 'streaming' },
    { id: 'spotify', name: 'Spotify', category: 'music' },
    { id: 'disney', name: 'Disney+', category: 'streaming' },
    { id: 'amazon-prime', name: 'Amazon Prime Video', category: 'streaming' },
    { id: 'apple-music', name: 'Apple Music', category: 'music' },
    { id: 'hbo-max', name: 'HBO Max', category: 'streaming' },
    { id: 'youtube-premium', name: 'YouTube Premium', category: 'streaming' },
    { id: 'paramount', name: 'Paramount+', category: 'streaming' },
    { id: 'hulu', name: 'Hulu', category: 'streaming' },
    { id: 'xbox-game-pass', name: 'Xbox Game Pass', category: 'gaming' },
    { id: 'office365', name: 'Office 365', category: 'productivity' },
    { id: 'other', name: 'Other', category: 'other' }
  ];

  // Categories defined but not used in current implementation

  const durations = [
    { value: '7', label: '7 days' },
    { value: '14', label: '14 days' },
    { value: '30', label: '30 days' },
    { value: '60', label: '60 days' },
    { value: '90', label: '90 days' }
  ];

  const commonFeatures = {
    streaming: ['HD/4K Quality', 'Multiple Profiles', 'Download Content', 'No Ads', 'Multiple Devices'],
    music: ['Ad-Free Music', 'Offline Downloads', 'High Quality Audio', 'Playlists', 'Podcasts'],
    gaming: ['Game Library', 'Online Multiplayer', 'Cloud Gaming', 'Early Access', 'DLC Included'],
    productivity: ['Cloud Storage', 'Collaboration Tools', 'Premium Templates', 'Advanced Features', 'Priority Support']
  };

  const handlePlatformSelect = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId);
    if (platform) {
      setForm(prev => ({
        ...prev,
        platform: platform.name,
        category: platform.category,
        features: []
      }));
      setCurrentStep(2);
    }
  };

  const toggleFeature = (feature: string) => {
    setForm(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;
    
    // Show transaction confirmation dialog
    setShowTransactionDialog(true);
  };

  const handleTransactionConfirm = async () => {
    setTransactionLoading(true);

    try {
      // Simulate blockchain transaction to mint NFT with subscription data
      console.log('Creating subscription NFT:', form);
      
      // Simulate transaction processing time
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Add subscription to the global state
      addSubscription({
        platform: form.platform,
        planName: form.planName,
        price: form.price,
        duration: form.duration,
        description: form.description,
        features: form.features,
        owner: user?.addr || 'demo-user',
      });
      
      // Close dialog and show success
      setShowTransactionDialog(false);
      setTransactionLoading(false);
      setCurrentStep(4);
    } catch (error) {
      console.error('Error creating subscription:', error);
      setTransactionLoading(false);
    }
  };

  const handleTransactionCancel = () => {
    setShowTransactionDialog(false);
    setTransactionLoading(false);
  };

  const isFormValid = () => {
    return form.platform && form.planName && form.email && form.password && 
           form.price && form.description && form.features.length > 0;
  };

  // Step 4: Success
  if (currentStep === 4) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Subscription Added!</h2>
          <p className="text-gray-400 mb-6">
            Your subscription has been tokenized and is now available for rent in the marketplace.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => {
                setCurrentStep(1);
                setForm({
                  platform: '', planName: '', email: '', password: '', price: '', 
                  duration: '30', category: '', description: '', features: []
                });
              }}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all"
            >
              Add Another Subscription
            </button>
            <button
              onClick={() => window.location.href = '/my-subscriptions'}
              className="w-full px-6 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              View My Subscriptions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Share Your Subscription</h1>
          <p className="text-gray-400">Monetize your unused subscription slots</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                  : 'bg-gray-800 text-gray-400'
              }`}>
                {step}
              </div>
              {step < 3 && (
                <div className={`w-12 h-px ml-4 ${
                  currentStep > step ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-gray-800'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Platform Selection */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white mb-2">Select Platform</h2>
              <p className="text-gray-400">Choose which subscription you want to share</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => handlePlatformSelect(platform.id)}
                  className="p-6 bg-gray-900/50 border border-gray-800/50 rounded-xl hover:border-purple-500/50 hover:bg-gray-800/50 transition-all text-center group"
                >
                  <div className="text-2xl mb-2">
                    {platform.id === 'netflix' && '🎬'}
                    {platform.id === 'spotify' && '🎵'}
                    {platform.id === 'disney' && '🏰'}
                    {platform.id === 'amazon-prime' && '📦'}
                    {platform.id === 'apple-music' && '🍎'}
                    {platform.id === 'hbo-max' && '🎭'}
                    {platform.id === 'youtube-premium' && '▶️'}
                    {platform.id === 'paramount' && '⭐'}
                    {platform.id === 'hulu' && '📺'}
                    {platform.id === 'xbox-game-pass' && '🎮'}
                    {platform.id === 'office365' && '💼'}
                    {platform.id === 'other' && '➕'}
                  </div>
                  <p className="text-white font-medium group-hover:text-purple-300 transition-colors">
                    {platform.name}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Subscription Details */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white mb-2">Subscription Details</h2>
              <p className="text-gray-400">Provide your account information and rental settings</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setCurrentStep(3); }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Plan Name</label>
                    <input
                      type="text"
                      value={form.planName}
                      onChange={(e) => setForm(prev => ({ ...prev, planName: e.target.value }))}
                      placeholder="e.g., Netflix Premium 4K"
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Account Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="account@example.com"
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Account password"
                        className="w-full px-4 py-3 pr-12 bg-gray-900/50 border border-gray-800/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Price (FLOW)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={form.price}
                        onChange={(e) => setForm(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="2.5"
                        className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
                      <select
                        value={form.duration}
                        onChange={(e) => setForm(prev => ({ ...prev, duration: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        {durations.map(duration => (
                          <option key={duration.value} value={duration.value}>
                            {duration.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your subscription plan and what's included..."
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Features</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(commonFeatures[form.category as keyof typeof commonFeatures] || []).map((feature) => (
                    <button
                      key={feature}
                      type="button"
                      onClick={() => toggleFeature(feature)}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${
                        form.features.includes(feature)
                          ? 'border-purple-500 bg-purple-500/20 text-white'
                          : 'border-gray-800/50 bg-gray-900/50 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {form.features.includes(feature) && <Check className="w-4 h-4 text-purple-400" />}
                        <span className="text-sm">{feature}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Security Notice */}
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-400 font-medium mb-1">Security Notice</p>
                    <p className="text-sm text-gray-300">
                      Your credentials are encrypted and stored securely on-chain. While rented, 
                      you won't be able to access this account to prevent conflicts.
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 px-6 py-3 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Review & Submit */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white mb-2">Review & Submit</h2>
              <p className="text-gray-400">Confirm your subscription details</p>
            </div>

            <div className="bg-gray-900/50 rounded-2xl border border-gray-800/50 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Subscription Info</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-400">Platform</p>
                      <p className="text-white">{form.platform}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Plan</p>
                      <p className="text-white">{form.planName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Description</p>
                      <p className="text-white">{form.description}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Rental Settings</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-400">Price</p>
                      <p className="text-white">{form.price} FLOW per {form.duration} days</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Features</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {form.features.map((feature) => (
                          <span
                            key={feature}
                            className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-lg"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 px-6 py-3 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors"
                  disabled={transactionLoading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid() || transactionLoading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <Upload className="w-5 h-5" />
                  <span>Create Subscription NFT</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Transaction Confirmation Dialog */}
      <TransactionConfirmDialog
        isOpen={showTransactionDialog}
        onClose={handleTransactionCancel}
        onConfirm={handleTransactionConfirm}
        transactionType="mint"
        details={{
          service: form.platform,
          amount: '0.05', // Minting fee
          subscriptionName: `${form.platform} ${form.planName}`,
        }}
        loading={transactionLoading}
      />
    </div>
  );
};

export default AddSubscription;

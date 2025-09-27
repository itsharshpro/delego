import { useState } from 'react';
import { Search, Filter, Star, Clock, Users, Play, Music, Film, Tv } from 'lucide-react';

interface MarketplaceSubscription {
  id: string;
  name: string;
  platform: string;
  price: number;
  duration: string;
  owner: string;
  rating: number;
  reviews: number;
  available: boolean;
  category: 'streaming' | 'music' | 'gaming' | 'productivity';
  description: string;
  features: string[];
}

const Marketplace = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('price');

  const categories = [
    { id: 'all', label: 'All', icon: Filter },
    { id: 'streaming', label: 'Streaming', icon: Film },
    { id: 'music', label: 'Music', icon: Music },
    { id: 'gaming', label: 'Gaming', icon: Play },
    { id: 'productivity', label: 'Productivity', icon: Tv }
  ];

  const subscriptions: MarketplaceSubscription[] = [
    {
      id: '1',
      name: 'Netflix Premium 4K',
      platform: 'Netflix',
      price: 2.5,
      duration: '30 days',
      owner: '0x1234...5678',
      rating: 4.8,
      reviews: 24,
      available: true,
      category: 'streaming',
      description: 'Premium Netflix account with 4K streaming and multiple profiles',
      features: ['4K Ultra HD', 'Multiple Profiles', '4 Concurrent Streams', 'Download Content']
    },
    {
      id: '2',
      name: 'Spotify Premium Family',
      platform: 'Spotify',
      price: 1.8,
      duration: '30 days',
      owner: '0x9876...5432',
      rating: 4.9,
      reviews: 18,
      available: true,
      category: 'music',
      description: 'Family plan with ad-free music and offline downloads',
      features: ['Ad-Free Music', 'Offline Downloads', 'High Quality Audio', 'Spotify Connect']
    },
    {
      id: '3',
      name: 'Disney+ Premium',
      platform: 'Disney+',
      price: 2.0,
      duration: '30 days',
      owner: '0xabcd...1234',
      rating: 4.7,
      reviews: 32,
      available: false,
      category: 'streaming',
      description: 'Access to Disney, Marvel, Star Wars, and National Geographic content',
      features: ['Disney Content', 'Marvel Movies', 'Star Wars', '4K Streaming']
    },
    {
      id: '4',
      name: 'Amazon Prime Video',
      platform: 'Prime Video',
      price: 1.5,
      duration: '30 days',
      owner: '0xef12...9876',
      rating: 4.6,
      reviews: 28,
      available: true,
      category: 'streaming',
      description: 'Prime Video with exclusive shows and movies',
      features: ['Prime Originals', 'Movie Rentals', 'Live TV', 'Mobile Downloads']
    },
    {
      id: '5',
      name: 'Apple Music Family',
      platform: 'Apple Music',
      price: 2.2,
      duration: '30 days',
      owner: '0x5678...abcd',
      rating: 4.5,
      reviews: 15,
      available: true,
      category: 'music',
      description: 'Apple Music family plan with lossless audio',
      features: ['Lossless Audio', 'Spatial Audio', 'Exclusive Content', 'Radio Stations']
    },
    {
      id: '6',
      name: 'HBO Max Premium',
      platform: 'HBO Max',
      price: 3.0,
      duration: '30 days',
      owner: '0xdef1...5679',
      rating: 4.9,
      reviews: 41,
      available: true,
      category: 'streaming',
      description: 'HBO Max with latest movies and exclusive series',
      features: ['Latest Movies', 'HBO Originals', '4K Content', 'Same-Day Releases']
    }
  ];

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         sub.platform.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || sub.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.price - b.price;
      case 'rating':
        return b.rating - a.rating;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const handleRent = (subscriptionId: string) => {
    console.log('Renting subscription:', subscriptionId);
    // TODO: Implement rental logic
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Marketplace</h1>
          <p className="text-gray-400">Discover and rent subscriptions from other users</p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search subscriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-800/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 bg-gray-900/50 border border-gray-800/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="price">Sort by Price</option>
            <option value="rating">Sort by Rating</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>

        {/* Categories */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                    : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>

        {/* Subscriptions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSubscriptions.map((subscription) => (
            <div
              key={subscription.id}
              className="bg-gray-900/50 rounded-2xl border border-gray-800/50 p-6 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-white text-lg">{subscription.name}</h3>
                  <p className="text-gray-400 text-sm">{subscription.platform}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs ${
                  subscription.available 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {subscription.available ? 'Available' : 'Rented'}
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-300 text-sm mb-4">{subscription.description}</p>

              {/* Features */}
              <div className="flex flex-wrap gap-2 mb-4">
                {subscription.features.slice(0, 2).map((feature, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-lg"
                  >
                    {feature}
                  </span>
                ))}
                {subscription.features.length > 2 && (
                  <span className="px-2 py-1 bg-gray-700/50 text-gray-400 text-xs rounded-lg">
                    +{subscription.features.length - 2} more
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between mb-4 text-sm">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-white">{subscription.rating}</span>
                    <span className="text-gray-400">({subscription.reviews})</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">{subscription.duration}</span>
                  </div>
                </div>
              </div>

              {/* Price and Action */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-white">{subscription.price}</span>
                  <span className="text-gray-400 ml-1">FLOW</span>
                </div>
                <button
                  onClick={() => handleRent(subscription.id)}
                  disabled={!subscription.available}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    subscription.available
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg hover:shadow-purple-500/25'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {subscription.available ? 'Rent Now' : 'Not Available'}
                </button>
              </div>

              {/* Owner */}
              <div className="mt-4 pt-4 border-t border-gray-800/50">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400 text-sm">Owner: {subscription.owner}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredSubscriptions.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No subscriptions found</h3>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;

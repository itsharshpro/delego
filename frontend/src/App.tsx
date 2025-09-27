
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Home, Search, User, Plus, TrendingUp, Share2 } from 'lucide-react';

// Components
import WalletConnect from './components/WalletConnect';
import Dashboard from './components/Dashboard';
import Marketplace from './components/Marketplace';
import MySubscriptions from './components/MySubscriptions';
import AddSubscription from './components/AddSubscription';
import Profile from './components/Profile';
import NetflixAccessPage from './components/NetflixAccessPage';

// Context
import { WalletProvider } from './contexts/WalletContext';
import { FlowProvider } from './contexts/FlowContext';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'marketplace', label: 'Marketplace', icon: Search },
    { id: 'my-subscriptions', label: 'My Subscriptions', icon: User },
    { id: 'add-subscription', label: 'Share Subscription', icon: Plus },
  ];

  return (
    <FlowProvider>
      <WalletProvider>
        <Router>
          <div className="h-screen bg-[rgb(8,8,8)] text-white overflow-hidden flex flex-col">
            {/* Header */}
            <header className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-b border-gray-800/50 px-6 py-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl">
                    <Share2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                      SubShare
                    </h1>
                    <p className="text-xs text-gray-400">Share & Rent Subscriptions</p>
                  </div>
                </div>
                <WalletConnect />
              </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar Navigation */}
              <nav className="w-64 bg-gray-900/50 border-r border-gray-800/50 p-4 backdrop-blur-sm">
                <div className="space-y-2">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                          activeTab === item.id
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Stats Card */}
                <div className="mt-8 p-4 bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-xl border border-gray-800/50">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-gray-300">Your Earnings</span>
                  </div>
                  <div className="text-2xl font-bold text-white">12.5 FLOW</div>
                  <div className="text-xs text-gray-400">+23% this month</div>
                </div>
              </nav>

              {/* Main Content */}
              <main className="flex-1 overflow-hidden">
                {activeTab === 'dashboard' && <Dashboard />}
                {activeTab === 'marketplace' && <Marketplace />}
                {activeTab === 'my-subscriptions' && <MySubscriptions />}
                {activeTab === 'add-subscription' && <AddSubscription />}
                {activeTab === 'profile' && <Profile />}
              </main>
            </div>
          </div>
        </Router>
      </WalletProvider>
    </FlowProvider>
  );
}

export default App;

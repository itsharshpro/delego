import { useState } from 'react';
import { User, Edit, Settings, Shield, Bell, HelpCircle } from 'lucide-react';

const Profile = () => {
  const [user] = useState({
    address: '0x1635dff04f103087',
    username: 'SubShare Pro',
    joinDate: '2024-01-15',
    totalEarnings: 45.2,
    totalRentals: 28,
    rating: 4.8,
    verified: true
  });

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Profile</h1>
          <p className="text-gray-400">Manage your account and settings</p>
        </div>

        {/* Profile Card */}
        <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-2xl border border-gray-800/50 p-8 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{user.username}</h2>
          <p className="text-gray-400 mb-4">{user.address}</p>
          
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{user.totalEarnings}</p>
              <p className="text-gray-400">FLOW Earned</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{user.totalRentals}</p>
              <p className="text-gray-400">Total Rentals</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{user.rating}</p>
              <p className="text-gray-400">Rating</p>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900/50 rounded-2xl border border-gray-800/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Account Settings</h3>
            <div className="space-y-4">
              <button className="w-full flex items-center space-x-3 p-4 bg-gray-800/50 rounded-xl hover:bg-gray-700/50 transition-colors">
                <Edit className="w-5 h-5 text-gray-400" />
                <span className="text-white">Edit Profile</span>
              </button>
              <button className="w-full flex items-center space-x-3 p-4 bg-gray-800/50 rounded-xl hover:bg-gray-700/50 transition-colors">
                <Shield className="w-5 h-5 text-gray-400" />
                <span className="text-white">Security Settings</span>
              </button>
              <button className="w-full flex items-center space-x-3 p-4 bg-gray-800/50 rounded-xl hover:bg-gray-700/50 transition-colors">
                <Bell className="w-5 h-5 text-gray-400" />
                <span className="text-white">Notifications</span>
              </button>
            </div>
          </div>

          <div className="bg-gray-900/50 rounded-2xl border border-gray-800/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Support</h3>
            <div className="space-y-4">
              <button className="w-full flex items-center space-x-3 p-4 bg-gray-800/50 rounded-xl hover:bg-gray-700/50 transition-colors">
                <HelpCircle className="w-5 h-5 text-gray-400" />
                <span className="text-white">Help Center</span>
              </button>
              <button className="w-full flex items-center space-x-3 p-4 bg-gray-800/50 rounded-xl hover:bg-gray-700/50 transition-colors">
                <Settings className="w-5 h-5 text-gray-400" />
                <span className="text-white">App Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

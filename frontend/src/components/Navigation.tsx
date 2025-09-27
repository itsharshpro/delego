import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/mint', label: 'Mint NFT' },
    { path: '/verify', label: 'Verify Identity' },
    { path: '/delegate', label: 'Delegations' },
    { path: '/access', label: 'Access Service' }
  ];

  return (
    <nav className="hidden md:flex items-center space-x-1">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            location.pathname === item.path
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
};

export default Navigation;

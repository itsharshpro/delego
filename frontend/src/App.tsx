
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Wallet, Shield, Users, QrCode, CheckCircle } from 'lucide-react';

// Components
import WalletConnect from './components/WalletConnect';
import FlowPassMint from './components/FlowPassMint';
import ZKProofGenerator from './components/ZKProofGenerator';
import DelegationManager from './components/DelegationManager';
import SubscriptionAccess from './components/SubscriptionAccess';
// import Navigation from './components/Navigation';

// Context
import { WalletProvider } from './contexts/WalletContext';
import { FlowProvider } from './contexts/FlowContext';

function App() {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { id: 'wallet', label: 'Connect Wallet', icon: Wallet },
    { id: 'mint', label: 'Mint FlowPass', icon: Shield },
    { id: 'verify', label: 'Generate Proof', icon: CheckCircle },
    { id: 'delegate', label: 'Create Delegation', icon: Users },
    { id: 'access', label: 'Access Service', icon: QrCode }
  ];

  return (
    <FlowProvider>
      <WalletProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-[rgb(10,10,10)]">
            {/* Header */}
            <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Shield className="w-8 h-8 text-blue-400" />
                  <h1 className="text-2xl font-bold text-white">Delego</h1>
                  <span className="text-sm text-gray-400 bg-gray-800 px-2 py-1 rounded">
                    NFT-Based Subscriptions
                  </span>
                </div>
                <WalletConnect />
              </div>
            </header>

            {/* Progress Steps */}
            <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;

                    return (
                      <div key={step.id} className="flex items-center">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                          isCompleted
                            ? 'bg-green-600 border-green-600'
                            : isActive
                            ? 'border-blue-400 bg-blue-400/10'
                            : 'border-gray-600 bg-gray-800'
                        }`}>
                          <Icon className={`w-5 h-5 ${
                            isCompleted ? 'text-white' : isActive ? 'text-blue-400' : 'text-gray-500'
                          }`} />
                        </div>
                        <span className={`ml-2 text-sm font-medium ${
                          isActive ? 'text-blue-400' : 'text-gray-400'
                        }`}>
                          {step.label}
                        </span>
                        {index < steps.length - 1 && (
                          <div className="ml-4 w-12 h-px bg-gray-700" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
              <Routes>
                <Route path="/" element={<Navigate to="/mint" replace />} />
                <Route path="/mint" element={<FlowPassMint onComplete={() => setCurrentStep(1)} />} />
                <Route path="/verify" element={<ZKProofGenerator onComplete={() => setCurrentStep(2)} />} />
                <Route path="/delegate" element={<DelegationManager onComplete={() => setCurrentStep(3)} />} />
                <Route path="/access" element={<SubscriptionAccess />} />
              </Routes>
            </main>

            {/* Footer */}
            <footer className="bg-gray-900 border-t border-gray-800 px-6 py-4 mt-16">
              <div className="max-w-7xl mx-auto text-center text-gray-400 text-sm">
                <p>Delego - Privacy-first NFT subscriptions powered by Flow blockchain</p>
              </div>
            </footer>
          </div>
        </Router>
      </WalletProvider>
    </FlowProvider>
  );
}

export default App;

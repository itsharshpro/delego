import React, { useState, useEffect } from 'react';
import { Users, QrCode, Clock, Trash2, AlertCircle, Plus } from 'lucide-react';
import QRCode from 'qrcode';
import { useWallet } from '../contexts/WalletContext';
import { useFlow } from '../contexts/FlowContext';

interface DelegationManagerProps {
  onComplete: () => void;
}

interface Delegation {
  id: number;
  passId: number;
  delegateAddress: string;
  expiresAt: number;
  isActive: boolean;
}

const DelegationManager: React.FC<DelegationManagerProps> = ({ onComplete }) => {
  const { user } = useWallet();
  const { executeTransaction } = useFlow();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  // Form state
  const [passId, setPassId] = useState('');
  const [delegateAddress, setDelegateAddress] = useState('');
  const [durationHours, setDurationHours] = useState('24');

  useEffect(() => {
    // Mock loading delegations - in real app, this would query the blockchain
    setDelegations([
      {
        id: 1,
        passId: 1,
        delegateAddress: '0x1234567890123456',
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours from now
        isActive: true
      }
    ]);
  }, []);

  const handleCreateDelegation = async () => {
    if (!passId || !delegateAddress || !durationHours) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const durationSeconds = parseInt(durationHours) * 60 * 60;

      const cadence = `
        import DelegationNFT from 0xDEPLOYED_CONTRACT_ADDRESS
        import FlowPassNFT from 0xDEPLOYED_CONTRACT_ADDRESS

        transaction(passId: UInt64, delegateAddress: Address, durationSeconds: UFix64) {

            let delegationCollection: &DelegationNFT.Collection{DelegationNFT.DelegationCollectionPublic}

            prepare(signer: AuthAccount) {
                if signer.borrow<&DelegationNFT.Collection>(from: /storage/DelegationCollection) == nil {
                    signer.save(<-DelegationNFT.createEmptyCollection(), to: /storage/DelegationCollection)
                    signer.link<&DelegationNFT.Collection{DelegationNFT.DelegationCollectionPublic, NonFungibleToken.CollectionPublic}>(
                        /public/DelegationCollection,
                        target: /storage/DelegationCollection
                    )
                }

                self.delegationCollection = signer.borrow<&DelegationNFT.Collection{DelegationNFT.DelegationCollectionPublic}>(
                    from: /storage/DelegationCollection
                ) ?? panic("Could not borrow delegation collection")
            }

            execute {
                let delegation <- DelegationNFT.createDelegation(
                    passId: passId,
                    delegateAddress: delegateAddress,
                    durationSeconds: durationSeconds
                )

                let delegationID = delegation.id
                self.delegationCollection.deposit(token: <-delegation)

                log("Delegation created with ID: ".concat(delegationID.toString()))
            }
        }
      `;

      await executeTransaction(cadence, [
        { value: passId, type: 'UInt64' },
        { value: delegateAddress, type: 'Address' },
        { value: durationSeconds.toString(), type: 'UFix64' }
      ]);

      // Generate QR code for sharing
      const delegationUrl = `${window.location.origin}/access?delegation=${Date.now()}`;
      const qrCodeDataUrl = await QRCode.toDataURL(delegationUrl);
      setQrCodeUrl(qrCodeDataUrl);

      setShowCreateForm(false);
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to create delegation');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeDelegation = async (delegationId: number) => {
    setLoading(true);
    setError(null);

    try {
      const cadence = `
        import DelegationNFT from 0xDEPLOYED_CONTRACT_ADDRESS

        transaction(delegationID: UInt64) {
            let delegationCollection: &DelegationNFT.Collection

            prepare(signer: AuthAccount) {
                self.delegationCollection = signer.borrow<&DelegationNFT.Collection>(
                    from: /storage/DelegationCollection
                ) ?? panic("Could not borrow delegation collection")
            }

            execute {
                DelegationNFT.revokeDelegation(collection: self.delegationCollection, delegationID: delegationID)
            }
        }
      `;

      await executeTransaction(cadence, [
        { value: delegationId.toString(), type: 'UInt64' }
      ]);

      // Update local state
      setDelegations(prev =>
        prev.map(d => d.id === delegationId ? { ...d, isActive: false } : d)
      );
    } catch (err: any) {
      setError(err.message || 'Failed to revoke delegation');
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimeRemaining = (expiresAt: number) => {
    const remaining = expiresAt - Date.now();
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (remaining <= 0) return 'Expired';
    return `${hours}h ${minutes}m remaining`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <div className="card-header">
          <Users className="w-8 h-8 text-blue-400 mb-2" />
          <h1 className="card-title">Manage Delegations</h1>
          <p className="card-description">
            Create time-bound delegations to share your subscription access with others.
          </p>
        </div>

        <div className="space-y-6">
          {/* Create Delegation Button */}
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Your Delegations</h2>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Delegation</span>
            </button>
          </div>

          {/* Create Delegation Form */}
          {showCreateForm && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-medium text-white mb-4">Create New Delegation</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    FlowPass ID
                  </label>
                  <input
                    type="number"
                    value={passId}
                    onChange={(e) => setPassId(e.target.value)}
                    placeholder="1"
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Delegate Address
                  </label>
                  <input
                    type="text"
                    value={delegateAddress}
                    onChange={(e) => setDelegateAddress(e.target.value)}
                    placeholder="0x1234567890abcdef"
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Duration (hours)
                  </label>
                  <select
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="1">1 hour</option>
                    <option value="24">24 hours</option>
                    <option value="168">1 week</option>
                    <option value="720">1 month</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleCreateDelegation}
                  disabled={loading}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Users className="w-4 h-4" />
                  )}
                  <span>Create Delegation</span>
                </button>

                <button
                  onClick={() => setShowCreateForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* QR Code Display */}
          {qrCodeUrl && (
            <div className="bg-green-900/20 border border-green-800 rounded-lg p-6 text-center">
              <h3 className="text-lg font-medium text-green-300 mb-4">Delegation Created!</h3>
              <p className="text-gray-400 mb-4">Share this QR code with the delegate:</p>
              <img src={qrCodeUrl} alt="Delegation QR Code" className="mx-auto mb-4" />
              <p className="text-sm text-gray-500">
                This delegation grants temporary access to your FlowPass subscription.
              </p>
            </div>
          )}

          {/* Delegations List */}
          <div className="space-y-4">
            {delegations.map((delegation) => (
              <div key={delegation.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-blue-400" />
                      <span className="text-white font-medium">
                        Delegation #{delegation.id}
                      </span>
                    </div>

                    <div className="text-sm text-gray-400">
                      Pass ID: {delegation.passId}
                    </div>

                    <div className="text-sm text-gray-400">
                      Delegate: {formatAddress(delegation.delegateAddress)}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className={`text-sm ${
                        delegation.isActive ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {formatTimeRemaining(delegation.expiresAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      delegation.isActive ? 'status-active' : 'status-expired'
                    }`}>
                      {delegation.isActive ? 'Active' : 'Expired'}
                    </span>

                    {delegation.isActive && (
                      <button
                        onClick={() => handleRevokeDelegation(delegation.id)}
                        className="btn-danger p-2"
                        title="Revoke delegation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {delegations.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No delegations found. Create your first delegation to get started.
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 text-red-400 bg-red-900/20 border border-red-800 rounded-lg p-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DelegationManager;

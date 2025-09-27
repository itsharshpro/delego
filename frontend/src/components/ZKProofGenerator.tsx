import React, { useState } from 'react';
import { Shield, CheckCircle, AlertCircle, Key } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useFlow } from '../contexts/FlowContext';

interface ZKProofGeneratorProps {
  onComplete: () => void;
}

const ZKProofGenerator: React.FC<ZKProofGeneratorProps> = ({ onComplete }) => {
  const { user } = useWallet();
  const { executeTransaction } = useFlow();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [proofType, setProofType] = useState<'human' | 'age18'>('human');
  const [proofData, setProofData] = useState<any>(null);

  const handleGenerateProof = async () => {
    if (!user?.addr) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate ZK proof generation (in real implementation, this would use Self SDK)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock proof data
      const mockProof = {
        proof: 'mock_zk_proof_' + Date.now(),
        publicSignals: ['signal1', 'signal2'],
        hash: '0x' + Math.random().toString(16).substr(2, 64),
        signature: '0x' + Math.random().toString(16).substr(2, 130)
      };

      setProofData(mockProof);

      // Anchor attestation on-chain
      const cadence = `
        import SelfAttestationRegistry from 0xDEPLOYED_CONTRACT_ADDRESS

        transaction(
            userAddress: Address,
            attesterPubKey: String,
            expiry: UFix64,
            proofHash: String,
            signature: String
        ) {

            let attestationCollection: &SelfAttestationRegistry.Collection

            prepare(signer: AuthAccount) {
                if signer.borrow<&SelfAttestationRegistry.Collection>(from: /storage/SelfAttestationCollection) == nil {
                    signer.save(<-SelfAttestationRegistry.createEmptyCollection(), to: /storage/SelfAttestationCollection)
                    signer.link<&SelfAttestationRegistry.Collection{SelfAttestationRegistry.AttestationCollectionPublic}>(
                        /public/SelfAttestationCollection,
                        target: /storage/SelfAttestationCollection
                    )
                }

                self.attestationCollection = signer.borrow<&SelfAttestationRegistry.Collection>(
                    from: /storage/SelfAttestationCollection
                ) ?? panic("Could not borrow attestation collection")
            }

            execute {
                let attestation <- SelfAttestationRegistry.anchorAttestation(
                    userAddress: userAddress,
                    attesterPubKey: attesterPubKey,
                    expiry: expiry,
                    proofHash: proofHash,
                    signature: signature
                )

                let attestationID = attestation.attestationId
                destroy attestation

                log("Attestation anchored with ID: ".concat(attestationID.toString()))
            }
        }
      `;

      const expiryTime = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60); // 1 year from now

      await executeTransaction(cadence, [
        { value: user.addr, type: 'Address' },
        { value: 'self-attester-pubkey', type: 'String' },
        { value: expiryTime.toString(), type: 'UFix64' },
        { value: mockProof.hash, type: 'String' },
        { value: mockProof.signature, type: 'String' }
      ]);

      setSuccess(true);
      setTimeout(() => onComplete(), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to generate and anchor ZK proof');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-400" />
          </div>
          <h2 className="card-title mb-2">ZK Proof Generated & Anchored!</h2>
          <p className="text-gray-400">
            Your privacy-preserving identity proof has been generated and anchored on-chain.
            You can now create delegations to share your subscription access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="card-header">
          <Key className="w-8 h-8 text-blue-400 mb-2" />
          <h1 className="card-title">Generate ZK Identity Proof</h1>
          <p className="card-description">
            Create a zero-knowledge proof of your identity that can be verified without revealing personal information.
          </p>
        </div>

        <div className="space-y-6">
          {/* Proof Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Proof Type
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  value="human"
                  checked={proofType === 'human'}
                  onChange={(e) => setProofType(e.target.value as 'human')}
                  className="text-blue-600"
                />
                <span className="text-gray-300">Human Verification</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  value="age18"
                  checked={proofType === 'age18'}
                  onChange={(e) => setProofType(e.target.value as 'age18')}
                  className="text-blue-600"
                />
                <span className="text-gray-300">Age ≥ 18 Verification</span>
              </label>
            </div>
          </div>

          {/* Proof Generation Info */}
          <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-300 mb-1">
                  Privacy-First Verification
                </h3>
                <p className="text-xs text-gray-400">
                  Your proof will be generated locally and only a hash will be stored on-chain.
                  No personal information is revealed or stored.
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 text-red-400 bg-red-900/20 border border-red-800 rounded-lg p-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerateProof}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating Proof...</span>
              </>
            ) : (
              <>
                <Key className="w-5 h-5" />
                <span>Generate ZK Proof</span>
              </>
            )}
          </button>
        </div>

        {/* Proof Data Display */}
        {proofData && (
          <div className="mt-6 p-4 bg-gray-800 rounded-lg">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Generated Proof:</h3>
            <div className="text-xs text-gray-500 bg-gray-900 p-3 rounded overflow-x-auto">
              <div>Hash: {proofData.hash}</div>
              <div>Signature: {proofData.signature.substring(0, 20)}...</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ZKProofGenerator;

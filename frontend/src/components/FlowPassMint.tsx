import React, { useState } from 'react';
import { Shield, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useFlow } from '../contexts/FlowContext';

interface FlowPassMintProps {
  onComplete: () => void;
}

const FlowPassMint: React.FC<FlowPassMintProps> = ({ onComplete }) => {
  const { user } = useWallet();
  const { executeTransaction } = useFlow();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [metadataURI, setMetadataURI] = useState('');
  const [isTransferable, setIsTransferable] = useState(true);

  const handleMint = async () => {
    if (!user?.addr) {
      setError('Please connect your wallet first');
      return;
    }

    if (!metadataURI.trim()) {
      setError('Please provide a metadata URI');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Cadence transaction for minting FlowPass
      const cadence = `
        import FlowPassNFT from 0xDEPLOYED_CONTRACT_ADDRESS

        transaction(metadataURI: String, isTransferable: Bool) {
            let recipientCollection: &FlowPassNFT.Collection{FlowPassNFT.FlowPassCollectionPublic}

            prepare(signer: AuthAccount) {
                if signer.borrow<&FlowPassNFT.Collection>(from: /storage/FlowPassCollection) == nil {
                    signer.save(<-FlowPassNFT.createEmptyCollection(), to: /storage/FlowPassCollection)
                    signer.link<&FlowPassNFT.Collection{FlowPassNFT.FlowPassCollectionPublic, NonFungibleToken.CollectionPublic}>(
                        /public/FlowPassCollection,
                        target: /storage/FlowPassCollection
                    )
                }

                self.recipientCollection = signer.borrow<&FlowPassNFT.Collection{FlowPassNFT.FlowPassCollectionPublic}>(
                    from: /storage/FlowPassCollection
                ) ?? panic("Could not borrow recipient collection")
            }

            execute {
                let nftID = FlowPassNFT.mintFlowPass(
                    recipient: self.recipientCollection,
                    metadataURI: metadataURI,
                    isTransferable: isTransferable
                )

                log("FlowPass NFT minted with ID: ".concat(nftID.toString()))
            }
        }
      `;

      await executeTransaction(cadence, [
        { value: metadataURI, type: 'String' },
        { value: isTransferable, type: 'Bool' }
      ]);

      setSuccess(true);
      setTimeout(() => onComplete(), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to mint FlowPass NFT');
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
          <h2 className="card-title mb-2">FlowPass Minted Successfully!</h2>
          <p className="text-gray-400">
            Your subscription NFT has been created. You can now proceed to generate a ZK proof for identity verification.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="card-header">
          <Shield className="w-8 h-8 text-blue-400 mb-2" />
          <h1 className="card-title">Mint Your FlowPass</h1>
          <p className="card-description">
            Create your subscription NFT that grants access to premium content and services.
          </p>
        </div>

        <div className="space-y-6">
          {/* Metadata URI Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Metadata URI
            </label>
            <input
              type="url"
              value={metadataURI}
              onChange={(e) => setMetadataURI(e.target.value)}
              placeholder="https://example.com/metadata.json"
              className="input-field w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              IPFS or HTTP URL containing your NFT metadata (name, description, image, etc.)
            </p>
          </div>

          {/* Transferability Toggle */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="transferable"
              checked={isTransferable}
              onChange={(e) => setIsTransferable(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="transferable" className="text-sm font-medium text-gray-300">
              Transferable NFT
            </label>
          </div>
          <p className="text-xs text-gray-500">
            If unchecked, this NFT cannot be transferred to other addresses.
          </p>

          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 text-red-400 bg-red-900/20 border border-red-800 rounded-lg p-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Mint Button */}
          <button
            onClick={handleMint}
            disabled={loading || !metadataURI.trim()}
            className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Minting...</span>
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                <span>Mint FlowPass NFT</span>
              </>
            )}
          </button>
        </div>

        {/* Sample Metadata */}
        <div className="mt-6 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Sample Metadata Structure:</h3>
          <pre className="text-xs text-gray-500 bg-gray-900 p-3 rounded overflow-x-auto">
{`{
  "name": "Premium FlowPass",
  "description": "Grants access to exclusive content",
  "image": "ipfs://Qm...",
  "attributes": [
    {
      "trait_type": "Subscription Tier",
      "value": "Premium"
    }
  ]
}`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default FlowPassMint;

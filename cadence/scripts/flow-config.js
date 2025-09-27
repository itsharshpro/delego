import { config } from '@onflow/fcl';

// Flow network configuration
export const FLOW_CONFIG = {
  testnet: {
    accessNode: 'https://rest-testnet.onflow.org',
    discoveryWallet: 'https://fcl-discovery.onflow.org/testnet/authn',
    flowTokenAddress: '0x7e60df042a9c0868',
    nonFungibleTokenAddress: '0x631e88ae7f1d7c20',
    metadataViewsAddress: '0x631e88ae7f1d7c20'
  },
  mainnet: {
    accessNode: 'https://rest-mainnet.onflow.org',
    discoveryWallet: 'https://fcl-discovery.onflow.org/authn',
    flowTokenAddress: '0x1654653399040a61',
    nonFungibleTokenAddress: '0x1d7e57aa55817448',
    metadataViewsAddress: '0x1d7e57aa55817448'
  }
};

// Contract addresses (update after deployment)
export const CONTRACT_ADDRESSES = {
  testnet: {
    FlowPassNFT: null,
    DelegationNFT: null,
    SelfAttestationRegistry: null
  },
  mainnet: {
    FlowPassNFT: null,
    DelegationNFT: null,
    SelfAttestationRegistry: null
  }
};

// Configure FCL
export function configureFCL(network = 'testnet') {
  config({
    'accessNode.api': FLOW_CONFIG[network].accessNode,
    'discovery.wallet': FLOW_CONFIG[network].discoveryWallet,
    'app.detail.title': 'Delego',
    'app.detail.icon': 'https://delego.app/icon.png',
    'app.detail.description': 'NFT-based subscription system with privacy-first identity verification',
    '0xFLOW': FLOW_CONFIG[network].flowTokenAddress,
    '0xNonFungibleToken': FLOW_CONFIG[network].nonFungibleTokenAddress,
    '0xMetadataViews': FLOW_CONFIG[network].metadataViewsAddress,
    '0xFlowPassNFT': CONTRACT_ADDRESSES[network].FlowPassNFT,
    '0xDelegationNFT': CONTRACT_ADDRESSES[network].DelegationNFT,
    '0xSelfAttestationRegistry': CONTRACT_ADDRESSES[network].SelfAttestationRegistry
  });
}

// Load deployment addresses from file
export function loadDeploymentAddresses(network = 'testnet') {
  try {
    const fs = require('fs');
    const path = require('path');
    const deploymentFile = path.join(__dirname, '..', `deployment-${network}.json`);

    if (fs.existsSync(deploymentFile)) {
      const addresses = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
      CONTRACT_ADDRESSES[network] = { ...CONTRACT_ADDRESSES[network], ...addresses };
      return addresses;
    }
  } catch (error) {
    console.warn('Could not load deployment addresses:', error.message);
  }
  return null;
}

// Transaction status utilities
export function getTransactionStatus(seal) {
  if (seal.status === 'PENDING') return 'Pending';
  if (seal.status === 'FINALIZED') return 'Finalized';
  if (seal.status === 'EXECUTED') return 'Executed';
  if (seal.status === 'SEALED') return 'Sealed';
  return 'Unknown';
}

// Error handling utility
export function handleTransactionError(error) {
  console.error('Transaction error:', error);

  if (error.includes('insufficient funds')) {
    return 'Insufficient funds to complete transaction';
  }

  if (error.includes('invalid argument')) {
    return 'Invalid transaction arguments';
  }

  if (error.includes('not authorized')) {
    return 'Not authorized to perform this action';
  }

  return 'Transaction failed: ' + error;
}

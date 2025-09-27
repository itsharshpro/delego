# Delego Backend API

Node.js/Express backend for the Delego NFT-based subscription system.

## Features

- ZK proof verification and attestation anchoring
- Flow blockchain transaction handling
- Delegation management and access verification
- RESTful API with comprehensive error handling
- Winston logging and security middleware

## Installation

```bash
cd backend
npm install
```

## Configuration

Copy `.env.example.txt` to `.env` and configure:

```bash
# Server
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173

# Flow Configuration
FLOW_NETWORK=testnet
FLOW_ACCESS_NODE=https://rest-testnet.onflow.org

# Contract Addresses (after deployment)
FLOWPASS_NFT_ADDRESS=0x...
DELEGATION_NFT_ADDRESS=0x...
SELF_ATTESTATION_REGISTRY_ADDRESS=0x...
```

## Running

```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### ZK Proof Verification
- `POST /api/zk/verify` - Verify ZK proof
- `POST /api/zk/anchor` - Anchor attestation on Flow
- `GET /api/zk/attestations/:address` - Get user attestations

### Flow Blockchain
- `POST /api/flow/transaction` - Execute transaction
- `GET /api/flow/account/:address` - Get account info
- `GET /api/flow/nft/:address/:contract/:id` - Get NFT info
- `GET /api/flow/delegations/:address` - Get delegations

### Delegations
- `POST /api/delegation/create` - Create delegation
- `POST /api/delegation/revoke/:id` - Revoke delegation
- `GET /api/delegation/active/:address` - Get active delegations
- `GET /api/delegation/verify/:address/:passId` - Verify access

## Development

The backend includes comprehensive logging, input validation, and error handling. All routes are documented with JSDoc comments and validated using Joi schemas.

## Deployment

Ensure all environment variables are set and contracts are deployed to the target network before deploying the backend.

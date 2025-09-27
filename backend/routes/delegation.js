const express = require('express');
const Joi = require('joi');
const winston = require('winston');

const router = express.Router();
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/delegation.log' })
  ]
});

// Validation schemas
const createDelegationSchema = Joi.object({
  passId: Joi.number().integer().positive().required(),
  delegateAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{16}$/).required(),
  durationSeconds: Joi.number().integer().min(3600).max(2592000).required(), // 1 hour to 30 days
  creatorAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{16}$/).required()
});

const delegationIdSchema = Joi.object({
  delegationId: Joi.number().integer().positive().required()
});

const addressSchema = Joi.object({
  address: Joi.string().pattern(/^0x[a-fA-F0-9]{16}$/).required()
});

/**
 * POST /api/delegation/create
 * Create a new delegation
 */
router.post('/create', async (req, res) => {
  try {
    const { error, value } = createDelegationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details[0].message
      });
    }

    const { passId, delegateAddress, durationSeconds, creatorAddress } = value;

    logger.info('Creating delegation', {
      passId,
      delegateAddress,
      creatorAddress,
      durationSeconds
    });

    // Verify that the creator owns the FlowPass NFT
    const ownsNFT = await verifyNFTOwnership(creatorAddress, passId);
    if (!ownsNFT) {
      return res.status(403).json({
        error: 'Creator does not own the specified FlowPass NFT'
      });
    }

    // Create the delegation on Flow
    const delegation = await createDelegationOnFlow({
      passId,
      delegateAddress,
      durationSeconds,
      creatorAddress
    });

    logger.info('Delegation created successfully', {
      delegationId: delegation.id,
      passId,
      delegateAddress
    });

    res.json({
      success: true,
      delegation: {
        id: delegation.id,
        passId,
        delegateAddress,
        expiresAt: delegation.expiresAt,
        creatorAddress,
        isActive: true,
        qrCode: generateDelegationQR(delegation.id)
      }
    });

  } catch (err) {
    logger.error('Error creating delegation:', err);
    res.status(500).json({
      error: 'Failed to create delegation'
    });
  }
});

/**
 * POST /api/delegation/revoke/:id
 * Revoke a delegation
 */
router.post('/revoke/:id', async (req, res) => {
  try {
    const { error, value } = delegationIdSchema.validate({ delegationId: req.params.id });
    if (error) {
      return res.status(400).json({
        error: 'Invalid delegation ID'
      });
    }

    const delegationId = parseInt(req.params.id);
    const { revokerAddress } = req.body;

    if (!revokerAddress || !/^0x[a-fA-F0-9]{16}$/.test(revokerAddress)) {
      return res.status(400).json({
        error: 'Valid revoker address required'
      });
    }

    logger.info('Revoking delegation', { delegationId, revokerAddress });

    // Verify that the revoker is the creator of the delegation
    const delegation = await getDelegationById(delegationId);
    if (!delegation) {
      return res.status(404).json({
        error: 'Delegation not found'
      });
    }

    if (delegation.creatorAddress !== revokerAddress) {
      return res.status(403).json({
        error: 'Only the delegation creator can revoke it'
      });
    }

    // Revoke the delegation on Flow
    await revokeDelegationOnFlow(delegationId, revokerAddress);

    logger.info('Delegation revoked successfully', { delegationId, revokerAddress });

    res.json({
      success: true,
      delegationId,
      revoked: true,
      revokedAt: Date.now()
    });

  } catch (err) {
    logger.error('Error revoking delegation:', err);
    res.status(500).json({
      error: 'Failed to revoke delegation'
    });
  }
});

/**
 * GET /api/delegation/active/:address
 * Get active delegations for an address
 */
router.get('/active/:address', async (req, res) => {
  try {
    const { error, value } = addressSchema.validate({ address: req.params.address });
    if (error) {
      return res.status(400).json({
        error: 'Invalid address format'
      });
    }

    const { address } = value;

    logger.info('Fetching active delegations', { address });

    const delegations = await getActiveDelegationsForAddress(address);

    res.json({
      address,
      delegations: delegations.filter(d => d.isActive),
      activeCount: delegations.filter(d => d.isActive).length
    });

  } catch (err) {
    logger.error('Error fetching active delegations:', err);
    res.status(500).json({
      error: 'Failed to fetch active delegations'
    });
  }
});

/**
 * GET /api/delegation/verify/:address/:passId
 * Verify if an address has access to a specific pass
 */
router.get('/verify/:address/:passId', async (req, res) => {
  try {
    const addressValidation = addressSchema.validate({ address: req.params.address });
    if (addressValidation.error) {
      return res.status(400).json({
        error: 'Invalid address format'
      });
    }

    const passId = parseInt(req.params.passId);
    if (isNaN(passId) || passId <= 0) {
      return res.status(400).json({
        error: 'Invalid pass ID'
      });
    }

    const { address } = addressValidation.value;

    logger.info('Verifying access', { address, passId });

    // Check direct ownership
    const ownsNFT = await verifyNFTOwnership(address, passId);

    // Check active delegations
    const delegations = await getActiveDelegationsForAddress(address);
    const hasActiveDelegation = delegations.some(d =>
      d.passId === passId && d.isActive && d.expiresAt > Date.now()
    );

    const hasAccess = ownsNFT || hasActiveDelegation;

    res.json({
      address,
      passId,
      hasAccess,
      ownsNFT,
      hasActiveDelegation,
      accessType: ownsNFT ? 'direct' : hasActiveDelegation ? 'delegated' : 'none'
    });

  } catch (err) {
    logger.error('Error verifying access:', err);
    res.status(500).json({
      error: 'Failed to verify access'
    });
  }
});

// Mock functions for demo purposes
// In a real implementation, these would interact with Flow blockchain

async function verifyNFTOwnership(address, passId) {
  // Mock ownership verification
  await new Promise(resolve => setTimeout(resolve, 300));
  return Math.random() > 0.5; // Random for demo
}

async function createDelegationOnFlow(delegationData) {
  // Simulate Flow transaction
  await new Promise(resolve => setTimeout(resolve, 1500));

  return {
    id: Math.floor(Math.random() * 100000),
    expiresAt: Date.now() + (delegationData.durationSeconds * 1000)
  };
}

async function revokeDelegationOnFlow(delegationId, revokerAddress) {
  // Simulate Flow transaction
  await new Promise(resolve => setTimeout(resolve, 1000));
  return true;
}

async function getDelegationById(delegationId) {
  // Mock delegation lookup
  return {
    id: delegationId,
    creatorAddress: '0x1234567890abcdef',
    passId: 123,
    delegateAddress: '0x9876543210fedcba',
    expiresAt: Date.now() + (24 * 60 * 60 * 1000),
    isActive: true
  };
}

async function getActiveDelegationsForAddress(address) {
  // Mock delegation data
  return [
    {
      id: 1,
      passId: 123,
      delegateAddress: address,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000),
      isActive: true,
      creatorAddress: '0x1234567890abcdef'
    },
    {
      id: 2,
      passId: 456,
      delegateAddress: address,
      expiresAt: Date.now() - (60 * 60 * 1000), // Expired
      isActive: false,
      creatorAddress: '0x1234567890abcdef'
    }
  ];
}

function generateDelegationQR(delegationId) {
  // In a real app, this would generate a proper QR code data URL
  return `https://delego.app/access?delegation=${delegationId}`;
}

module.exports = router;

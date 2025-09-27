/// SelfAttestationRegistry
///
/// A simplified registry for anchoring ZK proof attestations on-chain.
/// Stores minimal data on-chain (hashes/signatures) while proofs are stored off-chain.
/// Compatible with Cadence 1.0.
///
access(all) contract SelfAttestationRegistry {

    /// Total number of attestations registered
    access(all) var totalAttestations: UInt64

    /// Events
    access(all) event ContractInitialized()
    access(all) event AttestationAnchored(attestationId: UInt64, userAddress: Address, attesterPubKey: String, expiry: UFix64)
    access(all) event AttestationVerified(attestationId: UInt64, userAddress: Address, verified: Bool)

    /// Storage paths
    access(all) let RegistryStoragePath: StoragePath
    access(all) let RegistryPublicPath: PublicPath

    /// Attestation resource representing an anchored ZK proof
    access(all) resource Attestation {
        /// Unique identifier for the attestation
        access(all) let attestationId: UInt64

        /// Address of the user this attestation is for
        access(all) let userAddress: Address

        /// Public key of the attester (could be Self.ID service or other ZK provider)
        access(all) let attesterPubKey: String

        /// Timestamp when this attestation expires
        access(all) let expiry: UFix64

        /// Hash of the proof data (stored off-chain)
        access(all) let proofHash: String

        /// Signature over the proof hash
        access(all) let signature: String

        /// Whether this attestation has been verified
        access(all) var isVerified: Bool

        /// Timestamp when this attestation was created
        access(all) let createdAt: UFix64

        init(
            userAddress: Address,
            attesterPubKey: String,
            expiry: UFix64,
            proofHash: String,
            signature: String
        ) {
            self.attestationId = SelfAttestationRegistry.totalAttestations
            SelfAttestationRegistry.totalAttestations = SelfAttestationRegistry.totalAttestations + 1
            self.userAddress = userAddress
            self.attesterPubKey = attesterPubKey
            self.expiry = expiry
            self.proofHash = proofHash
            self.signature = signature
            self.isVerified = false
            self.createdAt = getCurrentBlock().timestamp
        }

        /// Check if this attestation is still valid (not expired)
        access(all) view fun isValid(): Bool {
            return getCurrentBlock().timestamp < self.expiry
        }

        /// Mark this attestation as verified
        access(all) fun verify() {
            self.isVerified = true
            emit AttestationVerified(
                attestationId: self.attestationId,
                userAddress: self.userAddress,
                verified: true
            )
        }
    }

    /// Public interface for the attestation registry
    access(all) resource interface RegistryPublic {
        access(all) fun getAttestation(attestationId: UInt64): &Attestation?
        access(all) fun getAllAttestationIds(): [UInt64]
        access(all) fun getUserAttestations(userAddress: Address): [UInt64]
    }

    /// Registry resource for storing attestations
    access(all) resource Registry: RegistryPublic {
        /// Dictionary of attestations by ID
        access(all) var attestations: @{UInt64: Attestation}

        /// Mapping of user addresses to their attestation IDs
        access(all) var userAttestations: {Address: [UInt64]}

        init() {
            self.attestations <- {}
            self.userAttestations = {}
        }

        /// Store a new attestation
        access(all) fun storeAttestation(attestation: @Attestation) {
            let attestationId = attestation.attestationId
            let userAddress = attestation.userAddress

            // Add to user's attestation list
            if self.userAttestations[userAddress] == nil {
                self.userAttestations[userAddress] = []
            }
            self.userAttestations[userAddress]!.append(attestationId)

            // Store the attestation
            let oldAttestation <- self.attestations[attestationId] <- attestation
            destroy oldAttestation
        }

        /// Get an attestation by ID
        access(all) fun getAttestation(attestationId: UInt64): &Attestation? {
            return &self.attestations[attestationId]
        }

        /// Get all attestation IDs
        access(all) fun getAllAttestationIds(): [UInt64] {
            return self.attestations.keys
        }

        /// Get attestation IDs for a specific user
        access(all) fun getUserAttestations(userAddress: Address): [UInt64] {
            return self.userAttestations[userAddress] ?? []
        }

        /// Verify an attestation by ID
        access(all) fun verifyAttestation(attestationId: UInt64) {
            let attestationRef = self.getAttestation(attestationId: attestationId)
                ?? panic("Attestation not found")
            attestationRef.verify()
        }
    }

    /// Create and anchor a new attestation
    access(all) fun createAttestation(
        userAddress: Address,
        attesterPubKey: String,
        expiry: UFix64,
        proofHash: String,
        signature: String
    ): UInt64 {
        let attestation <- create Attestation(
            userAddress: userAddress,
            attesterPubKey: attesterPubKey,
            expiry: expiry,
            proofHash: proofHash,
            signature: signature
        )

        let attestationId = attestation.attestationId

        // Get the registry from the contract account
        let registryRef = self.account.storage.borrow<&Registry>(from: self.RegistryStoragePath)
            ?? panic("Registry not found")

        registryRef.storeAttestation(attestation: <-attestation)

        emit AttestationAnchored(
            attestationId: attestationId,
            userAddress: userAddress,
            attesterPubKey: attesterPubKey,
            expiry: expiry
        )

        return attestationId
    }

    /// Get a reference to the public registry
    access(all) fun getRegistryPublic(): &{RegistryPublic} {
        return self.account.capabilities.get<&{RegistryPublic}>(self.RegistryPublicPath).borrow()
            ?? panic("Registry capability not found")
    }

    /// Verify an attestation (public function)
    access(all) fun verifyAttestation(attestationId: UInt64) {
        let registryRef = self.account.storage.borrow<&Registry>(from: self.RegistryStoragePath)
            ?? panic("Registry not found")
        registryRef.verifyAttestation(attestationId: attestationId)
    }

    init() {
        self.totalAttestations = 0
        
        self.RegistryStoragePath = /storage/AttestationRegistry
        self.RegistryPublicPath = /public/AttestationRegistry

        // Create and save the registry to the account storage
        let registry <- create Registry()
        self.account.storage.save(<-registry, to: self.RegistryStoragePath)

        // Create and publish a capability for the registry
        let registryCap = self.account.capabilities.storage.issue<&{RegistryPublic}>(self.RegistryStoragePath)
        self.account.capabilities.publish(registryCap, at: self.RegistryPublicPath)

        emit ContractInitialized()
    }
}

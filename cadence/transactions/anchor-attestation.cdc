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
        // Get or create attestation collection
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

        // Note: In production, you'd want to store this attestation somewhere accessible
        // For now, we'll destroy it since it's just anchoring the hash on-chain
        destroy attestation

        log("Attestation anchored with ID: ".concat(attestationID.toString()))
        log("User Address: ".concat(userAddress.toString()))
        log("Proof Hash: ".concat(proofHash))
    }
}

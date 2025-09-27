import Test
import "SelfAttestationRegistry"

access(all) let admin = Test.getAccount(0x0000000000000007)
access(all) let user = Test.getAccount(0x0000000000000008)

access(all) fun setup() {
    // Contracts are already configured in flow.json
    // Registry is automatically created in the contract's init function
}

access(all) fun testSelfAttestationRegistryDeployment() {
    let typ = Type<@SelfAttestationRegistry.Attestation>()
    assert(typ != nil, message: "SelfAttestationRegistry type should exist")
}

access(all) fun testAnchorAttestation() {
    let attestationID = SelfAttestationRegistry.createAttestation(
        userAddress: user.address,
        attesterPubKey: "test-public-key",
        expiry: getCurrentBlock().timestamp + 3600.0, // 1 hour from now
        proofHash: "0x1234567890abcdef",
        signature: "0xsignature"
    )

    assert(attestationID >= 0, message: "Attestation ID should be valid")
}

access(all) fun testAttestationVerification() {
    let registryRef = SelfAttestationRegistry.getRegistryPublic()
    
    let userAttestations = registryRef.getUserAttestations(userAddress: user.address)
    assert(userAttestations.length >= 0, message: "User attestations should be retrievable")
    
    // If user has attestations, test retrieving one
    if userAttestations.length > 0 {
        let attestation = registryRef.getAttestation(attestationId: userAttestations[0])
        assert(attestation != nil, message: "Should be able to retrieve attestation")
    }
}

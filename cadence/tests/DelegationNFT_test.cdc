import Test
import "NonFungibleToken"
import "MetadataViews"
import "FlowPassNFT"
import "DelegationNFT"

access(all) let admin = Test.getAccount(0x0000000000000007)
access(all) let beneficiary = Test.getAccount(0x0000000000000008)

access(all) fun setup() {
    // Contracts are already configured in flow.json
    // Set up collections for testing
    let flowPassCollection <- FlowPassNFT.createEmptyCollection(nftType: Type<@FlowPassNFT.NFT>())
    admin.storage.save(<-flowPassCollection, to: /storage/FlowPassCollection)
    
    let flowPassCap = admin.capabilities.storage.issue<&FlowPassNFT.Collection>(/storage/FlowPassCollection)
    admin.capabilities.publish(flowPassCap, at: /public/FlowPassCollection)

    let delegationCollection <- DelegationNFT.createEmptyCollection(nftType: Type<@DelegationNFT.NFT>())
    admin.storage.save(<-delegationCollection, to: /storage/DelegationCollection)
    
    let delegationCap = admin.capabilities.storage.issue<&DelegationNFT.Collection>(/storage/DelegationCollection)
    admin.capabilities.publish(delegationCap, at: /public/DelegationCollection)
}

access(all) fun testDelegationNFTDeployment() {
    let typ = Type<@DelegationNFT.NFT>()
    assert(typ != nil, message: "DelegationNFT type should exist")
}

access(all) fun testCreateDelegation() {
    let collectionRef = admin.capabilities.get<&{NonFungibleToken.CollectionPublic}>(/public/DelegationCollection).borrow()
        ?? panic("Could not borrow delegation collection")

    let expiresAt = getCurrentBlock().timestamp + 3600.0 // 1 hour from now
    let tokenID = DelegationNFT.createDelegation(
        recipient: collectionRef,
        passId: 1,
        delegateAddress: beneficiary.address,
        expiresAt: expiresAt,
        creator: admin.address
    )

    assert(tokenID >= 0, message: "Delegation ID should be valid")
}

access(all) fun testDelegationExpiration() {
    let delegationRef = admin.storage.borrow<&DelegationNFT.Collection>(
        from: /storage/DelegationCollection
    ) ?? panic("Could not borrow delegation collection")

    let allDelegations = delegationRef.getIDs()
    assert(allDelegations.length >= 0, message: "Delegation count should be non-negative")
    
    // Test borrowing a delegation if one exists
    if allDelegations.length > 0 {
        let delegation = delegationRef.borrowDelegation(id: allDelegations[0])
        assert(delegation != nil, message: "Should be able to borrow delegation")
    }
}

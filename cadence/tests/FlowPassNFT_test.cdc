import Test
import "NonFungibleToken"
import "MetadataViews"
import "FlowPassNFT"

access(all) let admin = Test.getAccount(0x0000000000000007)
access(all) let beneficiary = Test.getAccount(0x0000000000000008)

access(all) fun setup() {
    // Contracts are already configured in flow.json, no need to deploy here
}

access(all) fun testFlowPassNFTDeployment() {
    let typ = Type<@FlowPassNFT.NFT>()
    assert(typ != nil, message: "FlowPassNFT type should exist")
}

access(all) fun testMintFlowPass() {
    // Create a collection for the admin account
    let collection <- FlowPassNFT.createEmptyCollection(nftType: Type<@FlowPassNFT.NFT>())
    admin.storage.save(<-collection, to: /storage/FlowPassCollection)
    
    let collectionCap = admin.capabilities.storage.issue<&FlowPassNFT.Collection>(/storage/FlowPassCollection)
    admin.capabilities.publish(collectionCap, at: /public/FlowPassCollection)

    let collectionRef = admin.capabilities.get<&{NonFungibleToken.CollectionPublic}>(/public/FlowPassCollection).borrow()
        ?? panic("Could not borrow collection reference")

    let tokenID = FlowPassNFT.mintFlowPass(
        recipient: collectionRef,
        metadataURI: "https://example.com/metadata.json",
        isTransferable: true
    )

    assert(tokenID >= 0, message: "Token ID should be valid")
}

access(all) fun testGetFlowPassNFT() {
    let collectionRef = admin.storage.borrow<&FlowPassNFT.Collection>(
        from: /storage/FlowPassCollection
    ) ?? panic("Could not borrow collection reference")

    let ids = collectionRef.getIDs()
    if ids.length > 0 {
        let nftRef = collectionRef.borrowFlowPass(id: ids[0])
        assert(nftRef != nil, message: "NFT should exist")
        assert(nftRef!.getID() == ids[0], message: "NFT ID should match")
    }
}

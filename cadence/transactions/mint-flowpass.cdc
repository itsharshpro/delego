import FlowPassNFT from 0xDEPLOYED_CONTRACT_ADDRESS

transaction(metadataURI: String, isTransferable: Bool) {

    let recipientCollection: &FlowPassNFT.Collection{FlowPassNFT.FlowPassCollectionPublic}

    prepare(signer: AuthAccount) {
        // Get or create recipient's FlowPass collection
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

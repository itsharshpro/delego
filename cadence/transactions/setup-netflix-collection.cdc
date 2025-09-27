import NonFungibleToken from 0x1d7e57aa55817448
import FungibleToken from 0x9a0766d93b6608b7 
import FlowToken from 0x7e60df042a9c0868
import MetadataViews from 0x1d7e57aa55817448

transaction() {
    prepare(signer: AuthAccount) {
        // Create a collection if one doesn't exist
        if signer.borrow<&{NonFungibleToken.CollectionPublic}>(from: /storage/NetflixNFTCollection) == nil {
            let collection <- NetflixNFT.createEmptyCollection()
            signer.save(<-collection, to: /storage/NetflixNFTCollection)
            
            signer.link<&{NonFungibleToken.CollectionPublic, NetflixNFT.CollectionPublic, MetadataViews.ResolverCollection}>(
                /public/NetflixNFTCollection,
                target: /storage/NetflixNFTCollection
            )
        }
        
        log("NetflixNFT collection initialized for account")
    }
}

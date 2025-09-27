import SubscriptionNFT from 0x1635dff04f103087
import NonFungibleToken from 0x631e88ae7f1d7c20

/// Transaction to mint a new subscription NFT
/// This creates a tokenized version of a user's subscription that can be rented to others
transaction(
    platform: String,
    planName: String,
    pricePerDay: UFix64,
    maxRentalDuration: UInt64,
    email: String,
    encryptedPassword: String,
    description: String,
    features: [String]
) {
    let recipientCollection: &SubscriptionNFT.Collection{NonFungibleToken.CollectionPublic}

    prepare(signer: auth(BorrowValue, SaveValue, PublishInboxCapability) &Account) {
        // Create collection if it doesn't exist
        if signer.storage.borrow<&SubscriptionNFT.Collection>(from: SubscriptionNFT.CollectionStoragePath) == nil {
            signer.storage.save(<-SubscriptionNFT.createEmptyCollection(nftType: Type<@SubscriptionNFT.NFT>()), to: SubscriptionNFT.CollectionStoragePath)
            
            // Create and publish capability
            let collectionCap = signer.capabilities.storage.issue<&SubscriptionNFT.Collection>(SubscriptionNFT.CollectionStoragePath)
            signer.capabilities.publish(collectionCap, at: SubscriptionNFT.CollectionPublicPath)
        }

        self.recipientCollection = signer.storage.borrow<&SubscriptionNFT.Collection{NonFungibleToken.CollectionPublic}>(
            from: SubscriptionNFT.CollectionStoragePath
        ) ?? panic("Could not borrow recipient collection")
    }

    execute {
        // Create credentials struct
        let credentials = SubscriptionNFT.Credentials(
            email: email,
            encryptedPassword: encryptedPassword
        )

        // Mint the subscription NFT
        let nftID = SubscriptionNFT.mintSubscription(
            recipient: self.recipientCollection,
            platform: platform,
            planName: planName,
            pricePerDay: pricePerDay,
            maxRentalDuration: maxRentalDuration,
            credentials: credentials,
            description: description,
            features: features
        )

        log("Subscription NFT minted with ID: ".concat(nftID.toString()))
        log("Platform: ".concat(platform))
        log("Plan: ".concat(planName))
        log("Price per day: ".concat(pricePerDay.toString()).concat(" FLOW"))
    }
}

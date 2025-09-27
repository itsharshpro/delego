import SubscriptionNFT from 0x1635dff04f103087

/// Script to get all available subscriptions in the marketplace
/// Returns basic information about each subscription for browsing
access(all) fun main(): [{String: AnyStruct}] {
    let subscriptions: [{String: AnyStruct}] = []
    
    // This is a simplified version - in a real implementation,
    // you'd maintain a registry of all subscriptions or iterate through accounts
    
    // For demo, we'll just show how to get info for known subscriptions
    let knownOwners: [Address] = [0x1635dff04f103087] // Add known addresses here
    
    for owner in knownOwners {
        if let collection = getAccount(owner)
            .capabilities.get<&SubscriptionNFT.Collection>(SubscriptionNFT.CollectionStoragePath)
            .borrow() {
            
            let ids = collection.getIDs()
            
            for id in ids {
                if let subscription = collection.borrowSubscription(id: id) {
                    // Only include available subscriptions
                    if subscription.isAvailable && !subscription.isCurrentlyRented() {
                        subscriptions.append({
                            "id": id,
                            "owner": owner,
                            "platform": subscription.platform,
                            "planName": subscription.planName,
                            "pricePerDay": subscription.pricePerDay,
                            "maxRentalDuration": subscription.maxRentalDuration,
                            "description": subscription.description,
                            "features": subscription.features,
                            "rating": subscription.rating,
                            "rentalCount": subscription.rentalCount
                        })
                    }
                }
            }
        }
    }
    
    return subscriptions
}

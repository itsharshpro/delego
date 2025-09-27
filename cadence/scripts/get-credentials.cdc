import SubscriptionNFT from 0x1635dff04f103087

/// Script to get subscription credentials
/// Only returns credentials if the caller is authorized (owner or current renter)
access(all) fun main(subscriptionID: UInt64, owner: Address, caller: Address): SubscriptionNFT.Credentials? {
    // Get the owner's collection
    let collection = getAccount(owner)
        .capabilities.get<&SubscriptionNFT.Collection>(SubscriptionNFT.CollectionStoragePath)
        .borrow() ?? panic("Could not borrow owner's collection")

    // Get the subscription
    let subscription = collection.borrowSubscription(id: subscriptionID)
        ?? panic("Subscription not found")

    // Return credentials if authorized
    return subscription.getCredentials(caller: caller)
}

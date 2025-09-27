import SubscriptionNFT from 0x1635dff04f103087
import FlowToken from 0x1654653399040a61

/// Transaction to rent a subscription from another user
/// This allows users to pay FLOW tokens to temporarily access someone else's subscription
transaction(subscriptionID: UInt64, owner: Address, duration: UInt64, amount: UFix64) {
    let paymentVault: @FlowToken.Vault
    let marketplace: &{SubscriptionNFT.MarketplacePublic}

    prepare(signer: auth(BorrowValue) &Account) {
        // Get Flow Token vault
        let vaultRef = signer.storage.borrow<auth(FlowToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow FlowToken vault")

        // Withdraw payment
        self.paymentVault <- vaultRef.withdraw(amount: amount)

        // Get marketplace reference
        self.marketplace = getAccount(0x1635dff04f103087)
            .capabilities.get<&{SubscriptionNFT.MarketplacePublic}>(SubscriptionNFT.MarketplacePublicPath)
            .borrow() ?? panic("Could not borrow marketplace")
    }

    execute {
        // Rent the subscription
        self.marketplace.rentSubscription(
            id: subscriptionID,
            owner: owner,
            duration: duration,
            payment: <-self.paymentVault
        )

        log("Successfully rented subscription ID ".concat(subscriptionID.toString()))
        log("From owner: ".concat(owner.toString()))
        log("Duration: ".concat(duration.toString()).concat(" days"))
        log("Amount paid: ".concat(amount.toString()).concat(" FLOW"))
    }
}

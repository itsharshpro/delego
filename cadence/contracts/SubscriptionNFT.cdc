import NonFungibleToken from 0x631e88ae7f1d7c20
import MetadataViews from 0x631e88ae7f1d7c20
import FlowToken from 0x1654653399040a61

/// SubscriptionNFT
///
/// A subscription sharing marketplace contract where users can mint NFTs representing
/// their subscription services and rent them to others for FLOW tokens.
///
access(all) contract SubscriptionNFT: NonFungibleToken {

    /// Total supply of Subscription NFTs
    access(all) var totalSupply: UInt64

    /// Events
    access(all) event ContractInitialized()
    access(all) event Withdraw(id: UInt64, from: Address?)
    access(all) event Deposit(id: UInt64, to: Address?)
    access(all) event SubscriptionMinted(id: UInt64, platform: String, owner: Address)
    access(all) event SubscriptionRented(id: UInt64, renter: Address, owner: Address, amount: UFix64, duration: UInt64)
    access(all) event RentalEnded(id: UInt64, renter: Address, owner: Address)
    access(all) event RentalExtended(id: UInt64, renter: Address, newEndTime: UFix64)

    /// Storage paths
    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath
    access(all) let MarketplaceStoragePath: StoragePath
    access(all) let MarketplacePublicPath: PublicPath

    /// Rental information
    access(all) struct RentalInfo {
        access(all) let renter: Address
        access(all) let startTime: UFix64
        access(all) let endTime: UFix64
        access(all) let amount: UFix64

        init(renter: Address, startTime: UFix64, endTime: UFix64, amount: UFix64) {
            self.renter = renter
            self.startTime = startTime
            self.endTime = endTime
            self.amount = amount
        }
    }

    /// Subscription credentials (encrypted)
    access(all) struct Credentials {
        access(all) let email: String
        access(all) let encryptedPassword: String

        init(email: String, encryptedPassword: String) {
            self.email = email
            self.encryptedPassword = encryptedPassword
        }
    }

    /// Subscription NFT resource
    access(all) resource NFT: NonFungibleToken.NFT {
        /// Unique identifier for the NFT
        access(all) let id: UInt64

        /// Platform name (Netflix, Spotify, etc.)
        access(all) let platform: String

        /// Plan name (Premium, Family, etc.)
        access(all) let planName: String

        /// Rental price per day in FLOW
        access(all) var pricePerDay: UFix64

        /// Maximum rental duration in days
        access(all) var maxRentalDuration: UInt64

        /// Whether available for rent
        access(all) var isAvailable: Bool

        /// Account credentials (encrypted)
        access(all) let credentials: Credentials

        /// Description and features
        access(all) let description: String
        access(all) let features: [String]

        /// Current rental info (if rented)
        access(all) var currentRental: RentalInfo?

        /// Total earnings from rentals
        access(all) var totalEarnings: UFix64

        /// Total number of completed rentals
        access(all) var rentalCount: UInt64

        /// Rating (1-5 stars)
        access(all) var rating: UFix64
        access(all) var ratingCount: UInt64

        init(
            platform: String,
            planName: String, 
            pricePerDay: UFix64,
            maxRentalDuration: UInt64,
            credentials: Credentials,
            description: String,
            features: [String]
        ) {
            self.id = SubscriptionNFT.totalSupply
            SubscriptionNFT.totalSupply = SubscriptionNFT.totalSupply + 1
            self.platform = platform
            self.planName = planName
            self.pricePerDay = pricePerDay
            self.maxRentalDuration = maxRentalDuration
            self.credentials = credentials
            self.description = description
            self.features = features
            self.isAvailable = true
            self.currentRental = nil
            self.totalEarnings = 0.0
            self.rentalCount = 0
            self.rating = 0.0
            self.ratingCount = 0
        }

        /// Get the ID of this NFT
        access(all) view fun getID(): UInt64 {
            return self.id
        }

        /// Check if currently rented
        access(all) view fun isCurrentlyRented(): Bool {
            if let rental = self.currentRental {
                return getCurrentBlock().timestamp < rental.endTime
            }
            return false
        }

        /// Get credentials (only if not rented or if called by renter)
        access(all) fun getCredentials(caller: Address): Credentials? {
            if let rental = self.currentRental {
                if getCurrentBlock().timestamp < rental.endTime {
                    // If rented, only renter can access credentials
                    if caller == rental.renter {
                        return self.credentials
                    }
                    return nil
                }
            }
            // If not rented, only owner can access credentials
            if caller == self.owner?.address {
                return self.credentials
            }
            return nil
        }

        /// Start a rental
        access(all) fun startRental(renter: Address, duration: UInt64, payment: @FlowToken.Vault) {
            pre {
                self.isAvailable: "Subscription is not available for rent"
                !self.isCurrentlyRented(): "Subscription is already rented"
                duration <= self.maxRentalDuration: "Rental duration exceeds maximum allowed"
                payment.balance >= self.pricePerDay * UFix64(duration): "Insufficient payment"
            }

            let startTime = getCurrentBlock().timestamp
            let endTime = startTime + UFix64(duration) * 86400.0 // Convert days to seconds

            // Create rental info
            self.currentRental = RentalInfo(
                renter: renter,
                startTime: startTime, 
                endTime: endTime,
                amount: payment.balance
            )

            // Update earnings
            self.totalEarnings = self.totalEarnings + payment.balance

            // Transfer payment to owner
            if let ownerAddress = self.owner?.address {
                let ownerReceiver = getAccount(ownerAddress)
                    .capabilities.get<&{FlowToken.Receiver}>(/public/flowTokenReceiver)
                    .borrow() ?? panic("Could not borrow owner's FlowToken receiver")
                
                ownerReceiver.deposit(from: <-payment)
            } else {
                destroy payment
            }

            emit SubscriptionRented(
                id: self.id,
                renter: renter,
                owner: self.owner?.address!,
                amount: self.currentRental!.amount,
                duration: duration
            )
        }

        /// End rental (automatic or manual)
        access(all) fun endRental() {
            pre {
                self.isCurrentlyRented(): "No active rental"
            }

            let rental = self.currentRental!
            self.currentRental = nil
            self.rentalCount = self.rentalCount + 1

            emit RentalEnded(id: self.id, renter: rental.renter, owner: self.owner?.address!)
        }

        /// Update rating
        access(all) fun addRating(stars: UInt8) {
            pre {
                stars >= 1 && stars <= 5: "Rating must be between 1 and 5"
            }

            let newTotal = self.rating * UFix64(self.ratingCount) + UFix64(stars)
            self.ratingCount = self.ratingCount + 1
            self.rating = newTotal / UFix64(self.ratingCount)
        }

        /// Update availability
        access(all) fun setAvailability(_ available: Bool) {
            self.isAvailable = available
        }

        /// Update pricing
        access(all) fun updatePricing(newPrice: UFix64) {
            self.pricePerDay = newPrice
        }

        /// Create empty collection for this NFT type
        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <- SubscriptionNFT.createEmptyCollection(nftType: Type<@SubscriptionNFT.NFT>())
        }

        /// Get metadata views for this NFT
        access(all) view fun getViews(): [Type] {
            return [Type<MetadataViews.Display>()]
        }

        /// Resolve metadata views
        access(all) fun resolveView(_ view: Type): AnyStruct? {
            switch view {
                case Type<MetadataViews.Display>():
                    let status = self.isCurrentlyRented() ? "Rented" : (self.isAvailable ? "Available" : "Unavailable")
                    return MetadataViews.Display(
                        name: self.platform.concat(" - ").concat(self.planName),
                        description: self.description.concat(" - Status: ").concat(status),
                        thumbnail: MetadataViews.HTTPFile(url: "https://subshare.app/".concat(self.platform.toLower()).concat(".png"))
                    )
            }
            return nil
        }
    }

    /// Collection resource for storing Subscription NFTs
    access(all) resource Collection: NonFungibleToken.Collection {
        /// Dictionary of NFTs
        access(all) var ownedNFTs: @{UInt64: {NonFungibleToken.NFT}}

        init() {
            self.ownedNFTs <- {}
        }

        /// Withdraw a Subscription NFT from the collection
        access(NonFungibleToken.Withdraw) fun withdraw(withdrawID: UInt64): @{NonFungibleToken.NFT} {
            let token <- self.ownedNFTs.remove(key: withdrawID)
                ?? panic("Subscription NFT not found")

            let subscription <- token as! @SubscriptionNFT.NFT

            // Cannot transfer if currently rented
            if subscription.isCurrentlyRented() {
                panic("Cannot transfer rented subscription")
            }

            emit Withdraw(id: withdrawID, from: self.owner?.address)
            return <- subscription
        }

        /// Deposit a Subscription NFT into the collection
        access(all) fun deposit(token: @{NonFungibleToken.NFT}) {
            let token <- token as! @SubscriptionNFT.NFT
            let id: UInt64 = token.id

            // Add the new token to the dictionary
            let oldToken <- self.ownedNFTs[id] <- token

            emit Deposit(id: id, to: self.owner?.address)

            // Destroy the old token (should be nil)
            destroy oldToken
        }

        /// Get all NFT IDs in the collection
        access(all) view fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }

        /// Get the number of NFTs in the collection
        access(all) view fun getLength(): Int {
            return self.ownedNFTs.length
        }

        /// Borrow a reference to an NFT
        access(all) view fun borrowNFT(_ id: UInt64): &{NonFungibleToken.NFT}? {
            return &self.ownedNFTs[id]
        }

        /// Get supported NFT types
        access(all) view fun getSupportedNFTTypes(): {Type: Bool} {
            return {Type<@SubscriptionNFT.NFT>(): true}
        }

        /// Check if NFT type is supported
        access(all) view fun isSupportedNFTType(type: Type): Bool {
            return type == Type<@SubscriptionNFT.NFT>()
        }

        /// Iterate over all NFT IDs
        access(all) fun forEachID(_ f: fun (UInt64): Bool) {
            for id in self.ownedNFTs.keys {
                if !f(id) {
                    break
                }
            }
        }

        /// Borrow a Subscription NFT reference (typed)
        access(all) fun borrowSubscription(id: UInt64): &SubscriptionNFT.NFT? {
            if self.ownedNFTs[id] != nil {
                let ref = &self.ownedNFTs[id] as &{NonFungibleToken.NFT}?
                return ref as! &SubscriptionNFT.NFT
            }
            return nil
        }

        /// Create empty collection for this collection type
        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <- SubscriptionNFT.createEmptyCollection(nftType: Type<@SubscriptionNFT.NFT>())
        }
    }

    /// Marketplace interface for renting subscriptions
    access(all) resource interface MarketplacePublic {
        access(all) fun rentSubscription(id: UInt64, owner: Address, duration: UInt64, payment: @FlowToken.Vault)
        access(all) fun getAvailableSubscriptions(): [UInt64]
        access(all) fun getSubscriptionInfo(id: UInt64, owner: Address): {String: AnyStruct}?
    }

    /// Marketplace resource for handling rentals
    access(all) resource Marketplace: MarketplacePublic {
        
        /// Rent a subscription
        access(all) fun rentSubscription(id: UInt64, owner: Address, duration: UInt64, payment: @FlowToken.Vault) {
            let ownerCollection = getAccount(owner)
                .capabilities.get<&SubscriptionNFT.Collection>(SubscriptionNFT.CollectionPublicPath)
                .borrow() ?? panic("Could not borrow owner's collection")

            let subscriptionRef = ownerCollection.borrowSubscription(id: id)
                ?? panic("Subscription not found")

            let renter = payment.owner?.address ?? panic("Invalid payment vault")
            subscriptionRef.startRental(renter: renter, duration: duration, payment: <-payment)
        }

        /// Get all available subscriptions
        access(all) fun getAvailableSubscriptions(): [UInt64] {
            // This would need to be implemented with a registry of all subscriptions
            // For now, return empty array
            return []
        }

        /// Get subscription information
        access(all) fun getSubscriptionInfo(id: UInt64, owner: Address): {String: AnyStruct}? {
            let ownerCollection = getAccount(owner)
                .capabilities.get<&SubscriptionNFT.Collection>(SubscriptionNFT.CollectionPublicPath)
                .borrow()
            if ownerCollection == nil {
                return nil
            }

            let subscriptionRef = ownerCollection!.borrowSubscription(id: id)
            if subscriptionRef == nil {
                return nil
            }

            return {
                "id": subscriptionRef!.id,
                "platform": subscriptionRef!.platform,
                "planName": subscriptionRef!.planName,
                "pricePerDay": subscriptionRef!.pricePerDay,
                "maxRentalDuration": subscriptionRef!.maxRentalDuration,
                "isAvailable": subscriptionRef!.isAvailable,
                "isRented": subscriptionRef!.isCurrentlyRented(),
                "description": subscriptionRef!.description,
                "features": subscriptionRef!.features,
                "rating": subscriptionRef!.rating,
                "rentalCount": subscriptionRef!.rentalCount,
                "totalEarnings": subscriptionRef!.totalEarnings
            }
        }
    }

    /// Create an empty Collection
    access(all) fun createEmptyCollection(nftType: Type): @{NonFungibleToken.Collection} {
        return <- create Collection()
    }

    /// Mint a new Subscription NFT
    access(all) fun mintSubscription(
        recipient: &{NonFungibleToken.CollectionPublic},
        platform: String,
        planName: String,
        pricePerDay: UFix64,
        maxRentalDuration: UInt64,
        credentials: Credentials,
        description: String,
        features: [String]
    ): UInt64 {
        let owner = recipient.owner?.address ?? panic("Invalid recipient")
        
        let newNFT <- create NFT(
            platform: platform,
            planName: planName,
            pricePerDay: pricePerDay,
            maxRentalDuration: maxRentalDuration,
            credentials: credentials,
            description: description,
            features: features
        )
        
        let nftID = newNFT.id
        recipient.deposit(token: <-newNFT)
        
        emit SubscriptionMinted(id: nftID, platform: platform, owner: owner)
        return nftID
    }

    /// Create marketplace resource
    access(all) fun createMarketplace(): @Marketplace {
        return <- create Marketplace()
    }

    /// Get contract-level views (required by NonFungibleToken)
    access(all) view fun getContractViews(resourceType: Type?): [Type] {
        return []
    }

    /// Resolve contract-level views (required by NonFungibleToken)
    access(all) fun resolveContractView(resourceType: Type?, viewType: Type): AnyStruct? {
        return nil
    }

    init() {
        self.totalSupply = 0
        
        self.CollectionStoragePath = /storage/SubscriptionCollection
        self.CollectionPublicPath = /public/SubscriptionCollection
        self.MarketplaceStoragePath = /storage/SubscriptionMarketplace
        self.MarketplacePublicPath = /public/SubscriptionMarketplace

        // Create and save a collection to the account storage
        let collection <- create Collection()
        self.account.storage.save(<-collection, to: self.CollectionStoragePath)

        // Create and publish a capability for the collection
        let collectionCap = self.account.capabilities.storage.issue<&SubscriptionNFT.Collection>(self.CollectionStoragePath)
        self.account.capabilities.publish(collectionCap, at: self.CollectionPublicPath)

        // Create and save marketplace
        let marketplace <- create Marketplace()
        self.account.storage.save(<-marketplace, to: self.MarketplaceStoragePath)

        // Create and publish marketplace capability
        let marketplaceCap = self.account.capabilities.storage.issue<&{MarketplacePublic}>(self.MarketplaceStoragePath)
        self.account.capabilities.publish(marketplaceCap, at: self.MarketplacePublicPath)

        emit ContractInitialized()
    }
}

access(all) contract SubscriptionNFTSimple {

    access(all) event ContractInitialized()
    access(all) event SubscriptionNFTMinted(id: UInt64, to: Address, platform: String)
    access(all) event RentalStarted(nftId: UInt64, renter: Address, duration: UInt64, price: UFix64)
    access(all) event RentalEnded(nftId: UInt64)

    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath
    access(all) let MinterStoragePath: StoragePath

    access(all) var totalSupply: UInt64

    access(all) struct SubscriptionPlan {
        access(all) let platform: String
        access(all) let planName: String
        access(all) let pricePerDay: UFix64
        access(all) let maxRentalDuration: UInt64
        access(all) let features: [String]
        access(all) let description: String

        init(
            platform: String,
            planName: String,
            pricePerDay: UFix64,
            maxRentalDuration: UInt64,
            features: [String],
            description: String
        ) {
            self.platform = platform
            self.planName = planName
            self.pricePerDay = pricePerDay
            self.maxRentalDuration = maxRentalDuration
            self.features = features
            self.description = description
        }
    }

    access(all) struct SubscriptionRental {
        access(all) let renter: Address
        access(all) let startTime: UFix64
        access(all) let endTime: UFix64
        access(all) let totalPaid: UFix64

        init(renter: Address, startTime: UFix64, endTime: UFix64, totalPaid: UFix64) {
            self.renter = renter
            self.startTime = startTime
            self.endTime = endTime
            self.totalPaid = totalPaid
        }
    }

    access(all) resource NFT {
        access(all) let id: UInt64
        access(all) let ownerAddress: Address
        access(all) let platform: String
        access(all) let planName: String
        access(all) let pricePerDay: UFix64
        access(all) let maxRentalDuration: UInt64
        access(all) let encryptedCredentials: String
        access(all) let description: String
        access(all) let features: [String]
        access(all) var currentRental: SubscriptionRental?
        access(all) var totalEarnings: UFix64
        access(all) var rentalCount: UInt64
        access(all) var rating: UFix64
        access(all) var isAvailable: Bool

        init(
            id: UInt64,
            ownerAddress: Address,
            platform: String,
            planName: String,
            pricePerDay: UFix64,
            maxRentalDuration: UInt64,
            encryptedCredentials: String,
            description: String,
            features: [String]
        ) {
            self.id = id
            self.ownerAddress = ownerAddress
            self.platform = platform
            self.planName = planName
            self.pricePerDay = pricePerDay
            self.maxRentalDuration = maxRentalDuration
            self.encryptedCredentials = encryptedCredentials
            self.description = description
            self.features = features
            self.currentRental = nil
            self.totalEarnings = 0.0
            self.rentalCount = 0
            self.rating = 0.0
            self.isAvailable = true
        }

        access(all) view fun isCurrentlyRented(): Bool {
            if let rental = self.currentRental {
                return getCurrentBlock().timestamp < rental.endTime
            }
            return false
        }

        access(all) fun startRental(renter: Address, durationInDays: UFix64): UFix64 {
            pre {
                !self.isCurrentlyRented(): "Already rented"
                durationInDays > 0.0: "Duration must be positive"
                durationInDays <= UFix64(self.maxRentalDuration): "Duration exceeds maximum"
                self.isAvailable: "Subscription not available"
            }

            let startTime = getCurrentBlock().timestamp
            let durationInSeconds = durationInDays * 86400.0 // Convert days to seconds
            let endTime = startTime + durationInSeconds
            let totalPrice = durationInDays * self.pricePerDay

            self.currentRental = SubscriptionRental(
                renter: renter,
                startTime: startTime,
                endTime: endTime,
                totalPaid: totalPrice
            )

            self.totalEarnings = self.totalEarnings + totalPrice
            self.rentalCount = self.rentalCount + 1

            emit RentalStarted(nftId: self.id, renter: renter, duration: UInt64(durationInSeconds), price: totalPrice)

            return totalPrice
        }

        access(all) fun endRental() {
            pre {
                self.isCurrentlyRented(): "Not currently rented"
            }

            self.currentRental = nil
            emit RentalEnded(nftId: self.id)
        }

        access(all) fun getRentalInfo(): {String: AnyStruct}? {
            if let rental = self.currentRental {
                return {
                    "renter": rental.renter,
                    "startTime": rental.startTime,
                    "endTime": rental.endTime,
                    "totalPaid": rental.totalPaid,
                    "isActive": self.isCurrentlyRented()
                }
            }
            return nil
        }

        access(all) fun updateRating(newRating: UFix64) {
            if newRating >= 0.0 && newRating <= 5.0 {
                self.rating = newRating
            }
        }

        access(all) fun setAvailability(available: Bool) {
            self.isAvailable = available
        }
    }

    access(all) resource interface CollectionPublic {
        access(all) fun getIDs(): [UInt64]
        access(all) view fun borrowNFT(_ id: UInt64): &NFT?
        access(all) fun borrowSubscription(id: UInt64): &SubscriptionNFTSimple.NFT?
    }

    access(all) resource Collection: CollectionPublic {
        access(all) var ownedNFTs: @{UInt64: NFT}

        init() {
            self.ownedNFTs <- {}
        }

        access(all) fun withdraw(withdrawID: UInt64): @NFT {
            let token <- self.ownedNFTs.remove(key: withdrawID) 
                ?? panic("Missing NFT")
            return <-token
        }

        access(all) fun deposit(token: @NFT) {
            let id: UInt64 = token.id
            let oldToken <- self.ownedNFTs[id] <- token
            destroy oldToken
        }

        access(all) fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }

        access(all) view fun borrowNFT(_ id: UInt64): &NFT? {
            return &self.ownedNFTs[id]
        }

        access(all) fun borrowSubscription(id: UInt64): &SubscriptionNFTSimple.NFT? {
            if self.ownedNFTs[id] != nil {
                let ref = &self.ownedNFTs[id] as &NFT?
                return ref
            }
            return nil
        }
    }

    access(all) fun createEmptyCollection(): @Collection {
        return <- create Collection()
    }

    access(all) resource NFTMinter {
        access(all) fun mintNFT(
            recipient: Address,
            platform: String,
            planName: String,
            pricePerDay: UFix64,
            maxRentalDuration: UInt64,
            encryptedCredentials: String,
            description: String,
            features: [String]
        ): @NFT {
            let newNFT <- create NFT(
                id: SubscriptionNFTSimple.totalSupply,
                ownerAddress: recipient,
                platform: platform,
                planName: planName,
                pricePerDay: pricePerDay,
                maxRentalDuration: maxRentalDuration,
                encryptedCredentials: encryptedCredentials,
                description: description,
                features: features
            )

            emit SubscriptionNFTMinted(id: SubscriptionNFTSimple.totalSupply, to: recipient, platform: platform)
            SubscriptionNFTSimple.totalSupply = SubscriptionNFTSimple.totalSupply + 1

            return <-newNFT
        }
    }

    access(all) fun getPopularPlatforms(): [SubscriptionPlan] {
        return [
            SubscriptionPlan(
                platform: "Netflix",
                planName: "Premium",
                pricePerDay: 0.5,
                maxRentalDuration: 30,
                features: ["4K Ultra HD", "4 Screens", "HDR"],
                description: "Netflix Premium subscription with full access"
            ),
            SubscriptionPlan(
                platform: "Spotify",
                planName: "Premium",
                pricePerDay: 0.3,
                maxRentalDuration: 30,
                features: ["Ad-free music", "Offline downloads", "High quality audio"],
                description: "Spotify Premium with unlimited music streaming"
            ),
            SubscriptionPlan(
                platform: "Disney+",
                planName: "Standard",
                pricePerDay: 0.4,
                maxRentalDuration: 30,
                features: ["4K streaming", "Multiple profiles", "Disney content library"],
                description: "Disney+ subscription with full content library"
            )
        ]
    }

    access(all) fun getSubscriptionInfo(owner: Address, id: UInt64): {String: AnyStruct}? {
        let ownerCollection = getAccount(owner)
            .capabilities.get<&SubscriptionNFTSimple.Collection>(SubscriptionNFTSimple.CollectionPublicPath)
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

    init() {
        self.CollectionStoragePath = /storage/SubscriptionNFTSimpleCollection
        self.CollectionPublicPath = /public/SubscriptionNFTSimpleCollection  
        self.MinterStoragePath = /storage/SubscriptionNFTSimpleMinter

        self.totalSupply = 0

        let collection <- create Collection()
        self.account.storage.save(<-collection, to: self.CollectionStoragePath)

        let publicCapability = self.account.capabilities.storage.issue<&Collection>(
            self.CollectionStoragePath
        )
        self.account.capabilities.publish(publicCapability, at: self.CollectionPublicPath)

        let minter <- create NFTMinter()
        self.account.storage.save(<-minter, to: self.MinterStoragePath)

        emit ContractInitialized()
    }
}

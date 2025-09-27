access(all) contract NetflixNFTSimple {

    access(all) event ContractInitialized()
    access(all) event NetflixNFTMinted(id: UInt64, to: Address)
    access(all) event RentalStarted(nftId: UInt64, renter: Address, duration: UInt64, price: UFix64)
    access(all) event RentalEnded(nftId: UInt64)

    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath
    access(all) let MinterStoragePath: StoragePath

    access(all) var totalSupply: UInt64

    access(all) struct NetflixPlan {
        access(all) let name: String
        access(all) let pricePerMinute: UFix64
        access(all) let maxScreens: UInt64
        access(all) let features: [String]

        init(name: String, pricePerMinute: UFix64, maxScreens: UInt64, features: [String]) {
            self.name = name
            self.pricePerMinute = pricePerMinute
            self.maxScreens = maxScreens
            self.features = features
        }
    }

    access(all) struct NetflixRental {
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
        access(all) let netflixPlan: NetflixPlan
        access(all) let encryptedCredentials: String
        access(all) var currentRental: NetflixRental?
        access(all) var totalEarnings: UFix64
        access(all) var isActive: Bool

        init(
            id: UInt64,
            ownerAddress: Address,
            netflixPlan: NetflixPlan,
            encryptedCredentials: String
        ) {
            self.id = id
            self.ownerAddress = ownerAddress
            self.netflixPlan = netflixPlan
            self.encryptedCredentials = encryptedCredentials
            self.currentRental = nil
            self.totalEarnings = 0.0
            self.isActive = true
        }

        access(all) view fun isCurrentlyRented(): Bool {
            if let rental = self.currentRental {
                return getCurrentBlock().timestamp < rental.endTime
            }
            return false
        }

        access(all) fun startRental(renter: Address, duration: UInt64): UFix64 {
            pre {
                !self.isCurrentlyRented(): "Already rented"
                duration >= 60: "Minimum rental duration is 60 seconds (1 minute)"
                self.isActive: "NFT is not active"
            }

            let startTime = getCurrentBlock().timestamp
            let endTime = startTime + UFix64(duration)
            let durationInMinutes = UFix64(duration) / 60.0
            let totalPrice = durationInMinutes * self.netflixPlan.pricePerMinute

            self.currentRental = NetflixRental(
                renter: renter,
                startTime: startTime,
                endTime: endTime,
                totalPaid: totalPrice
            )

            self.totalEarnings = self.totalEarnings + totalPrice

            emit RentalStarted(nftId: self.id, renter: renter, duration: duration, price: totalPrice)

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
    }

    access(all) resource interface CollectionPublic {
        access(all) fun getIDs(): [UInt64]
        access(all) view fun borrowNFT(_ id: UInt64): &NFT?
        access(all) fun borrowNetflixNFT(id: UInt64): &NetflixNFTSimple.NFT?
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

        access(all) fun borrowNetflixNFT(id: UInt64): &NetflixNFTSimple.NFT? {
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
            ownerAddress: Address,
            netflixPlan: NetflixPlan,
            encryptedCredentials: String
        ): @NFT {
            let newNFT <- create NFT(
                id: NetflixNFTSimple.totalSupply,
                ownerAddress: ownerAddress,
                netflixPlan: netflixPlan,
                encryptedCredentials: encryptedCredentials
            )

            emit NetflixNFTMinted(id: NetflixNFTSimple.totalSupply, to: ownerAddress)
            NetflixNFTSimple.totalSupply = NetflixNFTSimple.totalSupply + 1

            return <-newNFT
        }
    }

    access(all) fun getNetflixPlans(): [NetflixPlan] {
        return [
            NetflixPlan(name: "Basic", pricePerMinute: 0.00174, maxScreens: 1, features: ["720p HD", "1 Screen"]),
            NetflixPlan(name: "Standard", pricePerMinute: 0.00278, maxScreens: 2, features: ["1080p HD", "2 Screens"]),
            NetflixPlan(name: "Premium", pricePerMinute: 0.00451, maxScreens: 4, features: ["4K Ultra HD", "4 Screens", "HDR"])
        ]
    }

    init() {
        self.CollectionStoragePath = /storage/NetflixNFTSimpleCollection
        self.CollectionPublicPath = /public/NetflixNFTSimpleCollection  
        self.MinterStoragePath = /storage/NetflixNFTSimpleMinter

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

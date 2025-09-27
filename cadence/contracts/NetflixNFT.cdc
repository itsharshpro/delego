import NonFungibleToken from 0x1d7e57aa55817448
import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868
import MetadataViews from 0x1d7e57aa55817448

access(all) contract NetflixNFT: NonFungibleToken {
    
    access(all) var totalSupply: UInt64

    access(all) event ContractInitialized()
    access(all) event Withdraw(id: UInt64, from: Address?)
    access(all) event Deposit(id: UInt64, to: Address?)
    access(all) event NetflixSubscriptionCreated(id: UInt64, owner: Address, plan: String)
    access(all) event NetflixRented(id: UInt64, renter: Address, duration: UInt64, amount: UFix64)
    access(all) event NetflixSessionCreated(id: UInt64, sessionId: String, renter: Address)
    access(all) event NetflixSessionRevoked(id: UInt64, sessionId: String)

    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath
    access(all) let MinterStoragePath: StoragePath

    access(all) struct NetflixPlan {
        access(all) let name: String
        access(all) let maxScreens: UInt8
        access(all) let hasUltraHD: Bool
        access(all) let pricePerMinute: UFix64
        access(all) let maxRentalMinutes: UInt64
        
        init(name: String, maxScreens: UInt8, hasUltraHD: Bool, pricePerMinute: UFix64, maxRentalMinutes: UInt64) {
            self.name = name
            self.maxScreens = maxScreens
            self.hasUltraHD = hasUltraHD
            self.pricePerMinute = pricePerMinute
            self.maxRentalMinutes = maxRentalMinutes
        }
    }

    access(all) struct NetflixSession {
        access(all) let sessionId: String
        access(all) let renter: Address
        access(all) let startTime: UFix64
        access(all) let endTime: UFix64
        access(all) let profileName: String
        access(all) let isActive: Bool
        
        init(sessionId: String, renter: Address, startTime: UFix64, endTime: UFix64, profileName: String) {
            self.sessionId = sessionId
            self.renter = renter
            self.startTime = startTime
            self.endTime = endTime
            self.profileName = profileName
            self.isActive = true
        }
    }

    access(all) struct NetflixRental {
        access(all) let renter: Address
        access(all) let startTime: UFix64
        access(all) let endTime: UFix64
        access(all) let totalPaid: UFix64
        access(all) let sessionId: String?
        
        init(renter: Address, startTime: UFix64, endTime: UFix64, totalPaid: UFix64, sessionId: String?) {
            self.renter = renter
            self.startTime = startTime
            self.endTime = endTime
            self.totalPaid = totalPaid
            self.sessionId = sessionId
        }
    }

    access(all) resource NFT: NonFungibleToken.INFT, MetadataViews.Resolver {
        access(all) let id: UInt64
        access(all) let owner: Address
        access(all) let netflixPlan: NetflixPlan
        access(all) let encryptedCredentials: String
        access(all) let credentialHash: String
        access(all) var currentRental: NetflixRental?
        access(all) var activeSessions: {String: NetflixSession}
        access(all) var totalEarnings: UFix64
        access(all) var isActive: Bool

        init(
            id: UInt64,
            owner: Address,
            netflixPlan: NetflixPlan,
            encryptedCredentials: String,
            credentialHash: String
        ) {
            self.id = id
            self.owner = owner
            self.netflixPlan = netflixPlan
            self.encryptedCredentials = encryptedCredentials
            self.credentialHash = credentialHash
            self.currentRental = nil
            self.activeSessions = {}
            self.totalEarnings = 0.0
            self.isActive = true
        }

        access(all) fun getViews(): [Type] {
            return [
                Type<MetadataViews.Display>(),
                Type<MetadataViews.NFTCollectionData>(),
                Type<MetadataViews.NFTCollectionDisplay>()
            ]
        }

        access(all) fun resolveView(_ view: Type): AnyStruct? {
            switch view {
                case Type<MetadataViews.Display>():
                    return MetadataViews.Display(
                        name: "Netflix ".concat(self.netflixPlan.name).concat(" Subscription"),
                        description: "Shareable Netflix subscription with ".concat(self.netflixPlan.maxScreens.toString()).concat(" screens"),
                        thumbnail: MetadataViews.HTTPFile(
                            url: "https://assets.nflxext.com/us/ffe/siteui/common/icons/nficon2016.png"
                        )
                    )
                case Type<MetadataViews.NFTCollectionData>():
                    return MetadataViews.NFTCollectionData(
                        storagePath: NetflixNFT.CollectionStoragePath,
                        publicPath: NetflixNFT.CollectionPublicPath,
                        providerPath: /private/NetflixNFTCollection,
                        publicCollection: Type<&{NetflixNFT.CollectionPublic}>(),
                        publicLinkedType: Type<&{NetflixNFT.CollectionPublic,NonFungibleToken.CollectionPublic,NonFungibleToken.Receiver,MetadataViews.ResolverCollection}>(),
                        providerLinkedType: Type<&{NetflixNFT.CollectionPublic,NonFungibleToken.CollectionPublic,NonFungibleToken.Provider,MetadataViews.ResolverCollection}>(),
                        createEmptyCollectionFunction: (fun (): @NonFungibleToken.Collection {
                            return <-NetflixNFT.createEmptyCollection()
                        })
                    )
            }
            return nil
        }

        // Check if currently rented
        access(all) fun isCurrentlyRented(): Bool {
            if let rental = self.currentRental {
                return getCurrentBlock().timestamp >= rental.startTime && 
                       getCurrentBlock().timestamp <= rental.endTime
            }
            return false
        }

        // Create Netflix session for renter
        access(all) fun createSession(sessionId: String, renter: Address, duration: UInt64): Bool {
            // Verify renter has active rental
            if let rental = self.currentRental {
                if rental.renter == renter && self.isCurrentlyRented() {
                    let startTime = getCurrentBlock().timestamp
                    let endTime = startTime + UFix64(duration)
                    let profileName = "Renter_".concat(renter.toString().slice(from: 2, upTo: 8))
                    
                    let session = NetflixSession(
                        sessionId: sessionId,
                        renter: renter,
                        startTime: startTime,
                        endTime: endTime,
                        profileName: profileName
                    )
                    
                    self.activeSessions[sessionId] = session
                    emit NetflixSessionCreated(id: self.id, sessionId: sessionId, renter: renter)
                    return true
                }
            }
            return false
        }

        // Get session access (only for authorized users)
        access(all) fun getSessionAccess(requester: Address, sessionId: String): NetflixSession? {
            // Owner has access when not rented
            if requester == self.owner && !self.isCurrentlyRented() {
                return nil // Owner uses regular login
            }
            
            // Renter has access to their session
            if let session = self.activeSessions[sessionId] {
                if requester == session.renter && 
                   getCurrentBlock().timestamp >= session.startTime &&
                   getCurrentBlock().timestamp <= session.endTime &&
                   session.isActive {
                    return session
                }
            }
            
            return nil
        }

        // Revoke session
        access(all) fun revokeSession(sessionId: String) {
            if let session = self.activeSessions[sessionId] {
                self.activeSessions.remove(key: sessionId)
                emit NetflixSessionRevoked(id: self.id, sessionId: sessionId)
            }
        }

        // Start rental (duration in seconds)
        access(all) fun startRental(renter: Address, duration: UInt64, payment: @FlowToken.Vault) {
            pre {
                !self.isCurrentlyRented(): "Already rented"
                self.isActive: "Subscription not active"
                duration <= self.netflixPlan.maxRentalMinutes * 60: "Rental duration too long"
                duration >= 60: "Minimum rental duration is 1 minute"
            }
            
            let expectedAmount = self.netflixPlan.pricePerMinute * UFix64(duration) / 60.0
            let paidAmount = payment.balance
            
            if paidAmount < expectedAmount {
                panic("Insufficient payment")
            }

            // Transfer payment to owner
            let ownerVault = getAccount(self.owner)
                .getCapability(/public/flowTokenReceiver)!
                .borrow<&{FungibleToken.Receiver}>()
                ?? panic("Could not borrow owner's Flow receiver")

            ownerVault.deposit(from: <-payment)

            // Create rental record
            let startTime = getCurrentBlock().timestamp
            let endTime = startTime + UFix64(duration)
            
            self.currentRental = NetflixRental(
                renter: renter,
                startTime: startTime,
                endTime: endTime,
                totalPaid: paidAmount,
                sessionId: nil
            )

            self.totalEarnings = self.totalEarnings + paidAmount

            emit NetflixRented(id: self.id, renter: renter, duration: duration, amount: paidAmount)
        }

        // End rental (cleanup expired)
        access(all) fun endRental() {
            if let rental = self.currentRental {
                if getCurrentBlock().timestamp > rental.endTime {
                    self.currentRental = nil
                    // Clean up all sessions for this rental
                    let sessionIds = self.activeSessions.keys
                    for sessionId in sessionIds {
                        if let session = self.activeSessions[sessionId] {
                            if session.renter == rental.renter {
                                self.revokeSession(sessionId: sessionId)
                            }
                        }
                    }
                }
            }
        }
    }

    access(all) resource interface CollectionPublic {
        access(all) fun deposit(token: @NonFungibleToken.NFT)
        access(all) fun getIDs(): [UInt64]
        access(all) fun borrowNFT(id: UInt64): &NonFungibleToken.NFT
        access(all) fun borrowNetflixNFT(id: UInt64): &NetflixNFT.NFT? {
            post {
                (result == nil) || (result?.id == id):
                    "Cannot borrow NetflixNFT reference: the ID of the returned reference is incorrect"
            }
        }
    }

    access(all) resource Collection: CollectionPublic, NonFungibleToken.Provider, NonFungibleToken.Receiver, NonFungibleToken.CollectionPublic, MetadataViews.ResolverCollection {
        access(all) var ownedNFTs: @{UInt64: NonFungibleToken.NFT}

        init () {
            self.ownedNFTs <- {}
        }

        access(all) fun withdraw(withdrawID: UInt64): @NonFungibleToken.NFT {
            let token <- self.ownedNFTs.remove(key: withdrawID) ?? panic("missing NFT")

            emit Withdraw(id: token.id, from: self.owner?.address)

            return <-token
        }

        access(all) fun deposit(token: @NonFungibleToken.NFT) {
            let token <- token as! @NetflixNFT.NFT

            let id: UInt64 = token.id

            let oldToken <- self.ownedNFTs[id] <- token

            emit Deposit(id: id, to: self.owner?.address)

            destroy oldToken
        }

        access(all) fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }

        access(all) fun borrowNFT(id: UInt64): &NonFungibleToken.NFT {
            return (&self.ownedNFTs[id] as &NonFungibleToken.NFT?)!
        }

        access(all) fun borrowNetflixNFT(id: UInt64): &NetflixNFT.NFT? {
            if self.ownedNFTs[id] != nil {
                let ref = (&self.ownedNFTs[id] as auth(NonFungibleToken.Withdrawable) &NonFungibleToken.NFT?)!
                return ref as! &NetflixNFT.NFT
            }

            return nil
        }

        access(all) fun borrowViewResolver(id: UInt64): &{MetadataViews.Resolver} {
            let nft = (&self.ownedNFTs[id] as auth(NonFungibleToken.Withdrawable) &NonFungibleToken.NFT?)!
            let netflixNFT = nft as! &NetflixNFT.NFT
            return netflixNFT as &{MetadataViews.Resolver}
        }
    }

    access(all) fun createEmptyCollection(): @NonFungibleToken.Collection {
        return <- create Collection()
    }

    access(all) resource NFTMinter {
        access(all) fun mintNFT(
            recipient: &{NonFungibleToken.CollectionPublic},
            netflixPlan: NetflixPlan,
            encryptedCredentials: String,
            credentialHash: String
        ): UInt64 {
            let newNFT <- create NFT(
                id: NetflixNFT.totalSupply,
                owner: recipient.owner!.address,
                netflixPlan: netflixPlan,
                encryptedCredentials: encryptedCredentials,
                credentialHash: credentialHash
            )

            let id = newNFT.id
            recipient.deposit(token: <-newNFT)

            NetflixNFT.totalSupply = NetflixNFT.totalSupply + 1

            emit NetflixSubscriptionCreated(id: id, owner: recipient.owner!.address, plan: netflixPlan.name)

            return id
        }
    }

    // Get predefined Netflix plans (pricing per minute for testing)
    access(all) fun getNetflixPlans(): [NetflixPlan] {
        return [
            NetflixPlan(name: "Basic", maxScreens: 1, hasUltraHD: false, pricePerMinute: 0.00174, maxRentalMinutes: 43200), // ~2.5 FLOW/day
            NetflixPlan(name: "Standard", maxScreens: 2, hasUltraHD: false, pricePerMinute: 0.00278, maxRentalMinutes: 43200), // ~4.0 FLOW/day  
            NetflixPlan(name: "Premium", maxScreens: 4, hasUltraHD: true, pricePerMinute: 0.00451, maxRentalMinutes: 43200) // ~6.5 FLOW/day
        ]
    }

    init() {
        self.totalSupply = 0

        self.CollectionStoragePath = /storage/NetflixNFTCollection
        self.CollectionPublicPath = /public/NetflixNFTCollection
        self.MinterStoragePath = /storage/NetflixNFTMinter

        let collection <- create Collection()
        self.account.save(<-collection, to: self.CollectionStoragePath)

        self.account.link<&{NonFungibleToken.CollectionPublic, NetflixNFT.CollectionPublic, MetadataViews.ResolverCollection}>(
            self.CollectionPublicPath,
            target: self.CollectionStoragePath
        )

        let minter <- create NFTMinter()
        self.account.save(<-minter, to: self.MinterStoragePath)

        emit ContractInitialized()
    }
}

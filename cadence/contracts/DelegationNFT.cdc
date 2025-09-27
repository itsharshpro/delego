import NonFungibleToken from 0x631e88ae7f1d7c20
import MetadataViews from 0x631e88ae7f1d7c20
// Note: FlowPassNFT will be imported after deployment

/// DelegationNFT
///
/// A simplified time-bound delegation NFT that grants temporary access to a FlowPass subscription.
/// Compatible with Cadence 1.0 and current Flow standards.
///
access(all) contract DelegationNFT: NonFungibleToken {

    /// Total supply of Delegation NFTs
    access(all) var totalSupply: UInt64

    /// Events
    access(all) event ContractInitialized()
    access(all) event Withdraw(id: UInt64, from: Address?)
    access(all) event Deposit(id: UInt64, to: Address?)
    access(all) event DelegationCreated(id: UInt64, passId: UInt64, delegateAddress: Address, expiresAt: UFix64, creator: Address)
    access(all) event DelegationRevoked(id: UInt64, passId: UInt64, delegateAddress: Address, revokedBy: Address)

    /// Storage paths
    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath

    /// Delegation NFT resource representing temporary access to a FlowPass
    access(all) resource NFT: NonFungibleToken.NFT {
        /// Unique identifier for the delegation NFT
        access(all) let id: UInt64

        /// ID of the FlowPass this delegation is for
        access(all) let passId: UInt64

        /// Address that has been granted access
        access(all) let delegateAddress: Address

        /// Timestamp when this delegation expires
        access(all) let expiresAt: UFix64

        /// Address that created this delegation
        access(all) let creator: Address

        /// Whether this delegation has been revoked
        access(all) var isRevoked: Bool

        init(passId: UInt64, delegateAddress: Address, expiresAt: UFix64, creator: Address) {
            self.id = DelegationNFT.totalSupply
            DelegationNFT.totalSupply = DelegationNFT.totalSupply + 1
            self.passId = passId
            self.delegateAddress = delegateAddress
            self.expiresAt = expiresAt
            self.creator = creator
            self.isRevoked = false
        }

        /// Get the ID of this NFT
        access(all) view fun getID(): UInt64 {
            return self.id
        }

        /// Check if delegation is currently valid (not expired or revoked)
        access(all) view fun isValid(): Bool {
            return !self.isRevoked && getCurrentBlock().timestamp < self.expiresAt
        }

        /// Revoke this delegation (only creator can revoke)
        access(all) fun revoke(revoker: Address) {
            if revoker != self.creator {
                panic("Only the delegation creator can revoke this delegation")
            }
            self.isRevoked = true
            emit DelegationRevoked(id: self.id, passId: self.passId, delegateAddress: self.delegateAddress, revokedBy: revoker)
        }

        /// Create empty collection for this NFT type
        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <- DelegationNFT.createEmptyCollection(nftType: Type<@DelegationNFT.NFT>())
        }

        /// Get metadata views for this NFT
        access(all) view fun getViews(): [Type] {
            return [Type<MetadataViews.Display>()]
        }

        /// Resolve metadata views
        access(all) fun resolveView(_ view: Type): AnyStruct? {
            switch view {
                case Type<MetadataViews.Display>():
                    let status = self.isValid() ? "Active" : "Expired/Revoked"
                    return MetadataViews.Display(
                        name: "Delegation #".concat(self.id.toString()),
                        description: "Delegation for FlowPass #".concat(self.passId.toString()).concat(" - Status: ").concat(status),
                        thumbnail: MetadataViews.HTTPFile(url: "https://delego.app/delegation-thumbnail.png")
                    )
            }
            return nil
        }
    }

    /// Collection resource for storing Delegation NFTs
    access(all) resource Collection: NonFungibleToken.Collection {
        /// Dictionary of NFTs
        access(all) var ownedNFTs: @{UInt64: {NonFungibleToken.NFT}}

        init() {
            self.ownedNFTs <- {}
        }

        /// Withdraw a Delegation NFT from the collection
        access(NonFungibleToken.Withdraw) fun withdraw(withdrawID: UInt64): @{NonFungibleToken.NFT} {
            let token <- self.ownedNFTs.remove(key: withdrawID)
                ?? panic("Delegation NFT not found")

            emit Withdraw(id: withdrawID, from: self.owner?.address)
            return <- token
        }

        /// Deposit a Delegation NFT into the collection
        access(all) fun deposit(token: @{NonFungibleToken.NFT}) {
            let token <- token as! @DelegationNFT.NFT
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
            return {Type<@DelegationNFT.NFT>(): true}
        }

        /// Check if NFT type is supported
        access(all) view fun isSupportedNFTType(type: Type): Bool {
            return type == Type<@DelegationNFT.NFT>()
        }

        /// Iterate over all NFT IDs
        access(all) fun forEachID(_ f: fun (UInt64): Bool) {
            for id in self.ownedNFTs.keys {
                if !f(id) {
                    break
                }
            }
        }

        /// Borrow a Delegation NFT reference (typed)
        access(all) fun borrowDelegation(id: UInt64): &DelegationNFT.NFT? {
            if self.ownedNFTs[id] != nil {
                let ref = &self.ownedNFTs[id] as &{NonFungibleToken.NFT}?
                return ref as! &DelegationNFT.NFT
            }
            return nil
        }

        /// Create empty collection for this collection type
        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <- DelegationNFT.createEmptyCollection(nftType: Type<@DelegationNFT.NFT>())
        }
    }

    /// Create an empty Collection
    access(all) fun createEmptyCollection(nftType: Type): @{NonFungibleToken.Collection} {
        return <- create Collection()
    }

    /// Create a new delegation NFT
    access(all) fun createDelegation(
        recipient: &{NonFungibleToken.CollectionPublic},
        passId: UInt64,
        delegateAddress: Address,
        expiresAt: UFix64,
        creator: Address
    ): UInt64 {
        let newNFT <- create NFT(
            passId: passId,
            delegateAddress: delegateAddress,
            expiresAt: expiresAt,
            creator: creator
        )
        let nftID = newNFT.id

        recipient.deposit(token: <-newNFT)
        emit DelegationCreated(
            id: nftID,
            passId: passId,
            delegateAddress: delegateAddress,
            expiresAt: expiresAt,
            creator: creator
        )
        return nftID
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
        
        self.CollectionStoragePath = /storage/DelegationCollection
        self.CollectionPublicPath = /public/DelegationCollection

        // Create and save a collection to the account storage
        let collection <- create Collection()
        self.account.storage.save(<-collection, to: self.CollectionStoragePath)

        // Create and publish a capability for the collection
        let collectionCap = self.account.capabilities.storage.issue<&DelegationNFT.Collection>(self.CollectionStoragePath)
        self.account.capabilities.publish(collectionCap, at: self.CollectionPublicPath)

        emit ContractInitialized()
    }
}

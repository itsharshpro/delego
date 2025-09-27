import NonFungibleToken from 0x631e88ae7f1d7c20
import MetadataViews from 0x631e88ae7f1d7c20

/// FlowPassNFT
///
/// A simplified subscription NFT contract that represents access to premium content/services.
/// Compatible with Cadence 1.0 and current Flow standards.
///
access(all) contract FlowPassNFT: NonFungibleToken {

    /// Total supply of FlowPass NFTs
    access(all) var totalSupply: UInt64

    /// Events
    access(all) event ContractInitialized()
    access(all) event Withdraw(id: UInt64, from: Address?)
    access(all) event Deposit(id: UInt64, to: Address?)
    access(all) event FlowPassMinted(id: UInt64, metadataURI: String, recipient: Address)

    /// Storage paths
    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath

    /// FlowPass NFT resource
    access(all) resource NFT: NonFungibleToken.NFT {
        /// Unique identifier for the NFT
        access(all) let id: UInt64

        /// IPFS or HTTP URL containing metadata
        access(all) let metadataURI: String

        /// Whether this NFT can be transferred
        access(all) var isTransferable: Bool

        init(metadataURI: String, isTransferable: Bool) {
            self.id = FlowPassNFT.totalSupply
            FlowPassNFT.totalSupply = FlowPassNFT.totalSupply + 1
            self.metadataURI = metadataURI
            self.isTransferable = isTransferable
        }

        /// Get the ID of this NFT
        access(all) view fun getID(): UInt64 {
            return self.id
        }

        /// Toggle transferability
        access(all) fun setTransferable(_ transferable: Bool) {
            self.isTransferable = transferable
        }

        /// Create empty collection for this NFT type
        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <- FlowPassNFT.createEmptyCollection(nftType: Type<@FlowPassNFT.NFT>())
        }

        /// Get metadata views for this NFT
        access(all) view fun getViews(): [Type] {
            return [Type<MetadataViews.Display>()]
        }

        /// Resolve metadata views
        access(all) fun resolveView(_ view: Type): AnyStruct? {
            switch view {
                case Type<MetadataViews.Display>():
                    return MetadataViews.Display(
                        name: "FlowPass #".concat(self.id.toString()),
                        description: "A subscription NFT for premium access",
                        thumbnail: MetadataViews.HTTPFile(url: self.metadataURI)
                    )
            }
            return nil
        }
    }

    /// Collection resource for storing FlowPass NFTs
    access(all) resource Collection: NonFungibleToken.Collection {
        /// Dictionary of NFTs
        access(all) var ownedNFTs: @{UInt64: {NonFungibleToken.NFT}}

        init() {
            self.ownedNFTs <- {}
        }

        /// Withdraw a FlowPass NFT from the collection
        access(NonFungibleToken.Withdraw) fun withdraw(withdrawID: UInt64): @{NonFungibleToken.NFT} {
            let token <- self.ownedNFTs.remove(key: withdrawID)
                ?? panic("FlowPass NFT not found")

            let flowPass <- token as! @FlowPassNFT.NFT

            // Check if NFT is transferable
            if !flowPass.isTransferable {
                panic("This FlowPass is not transferable")
            }

            emit Withdraw(id: flowPass.id, from: self.owner?.address)
            return <- flowPass
        }

        /// Deposit a FlowPass NFT into the collection
        access(all) fun deposit(token: @{NonFungibleToken.NFT}) {
            let token <- token as! @FlowPassNFT.NFT
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
            return {Type<@FlowPassNFT.NFT>(): true}
        }

        /// Check if NFT type is supported
        access(all) view fun isSupportedNFTType(type: Type): Bool {
            return type == Type<@FlowPassNFT.NFT>()
        }

        /// Iterate over all NFT IDs
        access(all) fun forEachID(_ f: fun (UInt64): Bool) {
            for id in self.ownedNFTs.keys {
                if !f(id) {
                    break
                }
            }
        }

        /// Borrow a FlowPass NFT reference (typed)
        access(all) fun borrowFlowPass(id: UInt64): &FlowPassNFT.NFT? {
            if self.ownedNFTs[id] != nil {
                let ref = &self.ownedNFTs[id] as &{NonFungibleToken.NFT}?
                return ref as! &FlowPassNFT.NFT
            }
            return nil
        }

        /// Create empty collection for this collection type
        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <- FlowPassNFT.createEmptyCollection(nftType: Type<@FlowPassNFT.NFT>())
        }
    }

    /// Create an empty Collection
    access(all) fun createEmptyCollection(nftType: Type): @{NonFungibleToken.Collection} {
        return <- create Collection()
    }

    /// Mint a new FlowPass NFT
    access(all) fun mintFlowPass(
        recipient: &{NonFungibleToken.CollectionPublic},
        metadataURI: String,
        isTransferable: Bool
    ): UInt64 {
        let owner = recipient.owner?.address ?? panic("Invalid recipient")
        let newNFT <- create NFT(metadataURI: metadataURI, isTransferable: isTransferable)
        let nftID = newNFT.id

        recipient.deposit(token: <-newNFT)
        emit FlowPassMinted(id: nftID, metadataURI: metadataURI, recipient: owner)
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
        
        self.CollectionStoragePath = /storage/FlowPassCollection
        self.CollectionPublicPath = /public/FlowPassCollection

        // Create and save a collection to the account storage
        let collection <- create Collection()
        self.account.storage.save(<-collection, to: self.CollectionStoragePath)

        // Create and publish a capability for the collection
        let collectionCap = self.account.capabilities.storage.issue<&FlowPassNFT.Collection>(self.CollectionStoragePath)
        self.account.capabilities.publish(collectionCap, at: self.CollectionPublicPath)

        emit ContractInitialized()
    }
}

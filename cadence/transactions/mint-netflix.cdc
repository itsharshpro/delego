import NetflixNFT from 0x1635dff04f103087
import NonFungibleToken from 0x1d7e57aa55817448

transaction(
    planName: String,
    encryptedCredentials: String,
    credentialHash: String
) {
    let minterRef: &NetflixNFT.NFTMinter
    let collectionRef: &{NonFungibleToken.CollectionPublic}
    
    prepare(signer: AuthAccount) {
        // Borrow minter reference (only contract deployer can mint)
        self.minterRef = signer.borrow<&NetflixNFT.NFTMinter>(from: NetflixNFT.MinterStoragePath)
            ?? panic("Could not borrow minter reference")
        
        // Borrow collection reference
        self.collectionRef = signer.getCapability(NetflixNFT.CollectionPublicPath)
            .borrow<&{NonFungibleToken.CollectionPublic}>()
            ?? panic("Could not borrow collection reference")
    }
    
    execute {
        // Get Netflix plans and find the requested one
        let plans = NetflixNFT.getNetflixPlans()
        var selectedPlan: NetflixNFT.NetflixPlan? = nil
        
        for plan in plans {
            if plan.name == planName {
                selectedPlan = plan
                break
            }
        }
        
        if selectedPlan == nil {
            panic("Invalid plan name: ".concat(planName))
        }
        
        // Mint the Netflix NFT
        let nftId = self.minterRef.mintNFT(
            recipient: self.collectionRef,
            netflixPlan: selectedPlan!,
            encryptedCredentials: encryptedCredentials,
            credentialHash: credentialHash
        )
        
        log("Netflix subscription NFT minted with ID: ".concat(nftId.toString()))
    }
}

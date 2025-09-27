import DelegationNFT from 0xDEPLOYED_CONTRACT_ADDRESS
import FlowPassNFT from 0xDEPLOYED_CONTRACT_ADDRESS

transaction(passId: UInt64, delegateAddress: Address, durationSeconds: UFix64) {

    let delegationCollection: &DelegationNFT.Collection{DelegationNFT.DelegationCollectionPublic}

    prepare(signer: AuthAccount) {
        // Verify that the signer owns the FlowPass
        let flowPassCollection = signer.borrow<&FlowPassNFT.Collection>(
            from: /storage/FlowPassCollection
        ) ?? panic("Could not borrow FlowPass collection")

        let flowPass = flowPassCollection.borrowFlowPass(id: passId)
            ?? panic("FlowPass not found or not owned by signer")

        // Get or create delegation collection
        if signer.borrow<&DelegationNFT.Collection>(from: /storage/DelegationCollection) == nil {
            signer.save(<-DelegationNFT.createEmptyCollection(), to: /storage/DelegationCollection)
            signer.link<&DelegationNFT.Collection{DelegationNFT.DelegationCollectionPublic, NonFungibleToken.CollectionPublic}>(
                /public/DelegationCollection,
                target: /storage/DelegationCollection
            )
        }

        self.delegationCollection = signer.borrow<&DelegationNFT.Collection{DelegationNFT.DelegationCollectionPublic}>(
            from: /storage/DelegationCollection
        ) ?? panic("Could not borrow delegation collection")
    }

    execute {
        let delegation <- DelegationNFT.createDelegation(
            passId: passId,
            delegateAddress: delegateAddress,
            durationSeconds: durationSeconds
        )

        let delegationID = delegation.id

        // Deposit the delegation NFT to the collection
        self.delegationCollection.deposit(token: <-delegation)

        log("Delegation created with ID: ".concat(delegationID.toString()))
        log("Delegate Address: ".concat(delegateAddress.toString()))
        log("Duration: ".concat(durationSeconds.toString()).concat(" seconds"))
    }
}

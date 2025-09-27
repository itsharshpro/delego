#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const FLOW_CLI = 'flow';
const TESTNET_ACCOUNT = 'itsharshpro';
const NETWORK = 'testnet';

const CONTRACTS = [
  'FlowPassNFT',
  'DelegationNFT', 
  'SelfAttestationRegistry'
];

async function deployContracts() {
  console.log('🚀 Starting contract deployment to Flow testnet...\n');

  try {
    // Check Flow CLI version
    const { stdout: versionOutput } = await execAsync('flow version');
    console.log('Flow CLI Version:', versionOutput.trim());

    // Check account status
    console.log('\n📋 Checking account status...');
    const { stdout: accountOutput } = await execAsync(`flow accounts get ${TESTNET_ACCOUNT} --network=${NETWORK}`);
    console.log('Account status checked ✅\n');

    // Deploy/update contracts
    for (const contractName of CONTRACTS) {
      const contractPath = `./cadence/contracts/${contractName}.cdc`;
      
      console.log(`📄 Processing ${contractName}...`);
      
      try {
        // Check if contract exists
        const contractExists = accountOutput.includes(`Contract: '${contractName}'`);
        
        if (contractExists) {
          console.log(`🔄 Updating existing contract: ${contractName}`);
          const { stdout } = await execAsync(`flow accounts update-contract ${contractPath} --network=${NETWORK} --signer=${TESTNET_ACCOUNT}`);
          console.log(`✅ ${contractName} updated successfully!`);
        } else {
          console.log(`🆕 Deploying new contract: ${contractName}`);
          const { stdout } = await execAsync(`flow accounts add-contract ${contractPath} --network=${NETWORK} --signer=${TESTNET_ACCOUNT}`);
          console.log(`✅ ${contractName} deployed successfully!`);
        }
      } catch (error) {
        console.error(`❌ Error with ${contractName}:`, error.message);
        // Continue with other contracts even if one fails
      }
      
      console.log(''); // Empty line for spacing
    }

    // Final status check
    console.log('🔍 Final contract status:');
    const { stdout: finalStatus } = await execAsync(`flow accounts get ${TESTNET_ACCOUNT} --network=${NETWORK}`);
    const deployedContracts = finalStatus.match(/Contract: '([^']+)'/g) || [];
    deployedContracts.forEach(contract => {
      console.log(`  ✅ ${contract}`);
    });

    console.log('\n🎉 Contract deployment process completed!');
    console.log(`📍 All contracts deployed to account: 0x${TESTNET_ACCOUNT}`);
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run deployment
deployContracts();

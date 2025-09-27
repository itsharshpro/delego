#!/usr/bin/env node
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const FLOW_CLI = 'flow';
const TESTNET_ACCOUNT = 'harshpro'; // Your account from flow.json
const NETWORK = 'testnet';

console.log('🚀 Deploying NetflixNFT Contract...');
console.log(`Account: ${TESTNET_ACCOUNT}`);
console.log(`Network: ${NETWORK}`);

// Check if contract file exists
const contractPath = './contracts/NetflixNFT.cdc';
if (!fs.existsSync(contractPath)) {
  console.error(`❌ Contract file not found: ${contractPath}`);
  process.exit(1);
}

// Deploy function
function deployNetflixNFT() {
  return new Promise((resolve, reject) => {
    // First check if contract already exists
    const checkCommand = `${FLOW_CLI} accounts get ${TESTNET_ACCOUNT} --network=${NETWORK}`;
    
    console.log('🔍 Checking if NetflixNFT contract already exists...');
    
    exec(checkCommand, (checkError, checkStdout, checkStderr) => {
      if (checkError) {
        console.error('❌ Error checking account:', checkError.message);
        reject(checkError);
        return;
      }

      const contractExists = checkStdout.includes("Contract: 'NetflixNFT'");
      
      const command = contractExists 
        ? `${FLOW_CLI} accounts update-contract ${contractPath} --network=${NETWORK} --signer=${TESTNET_ACCOUNT}`
        : `${FLOW_CLI} accounts add-contract ${contractPath} --network=${NETWORK} --signer=${TESTNET_ACCOUNT}`;

      console.log(`${contractExists ? '🔄 Updating' : '📦 Deploying'} NetflixNFT contract...`);
      console.log(`Command: ${command}`);

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Error ${contractExists ? 'updating' : 'deploying'} NetflixNFT:`, error.message);
          console.error('stderr:', stderr);
          reject(error);
          return;
        }

        if (stderr) {
          console.warn('⚠️  Warning:', stderr);
        }

        console.log('✅ NetflixNFT contract deployed successfully!');
        console.log('Output:', stdout);

        // Extract transaction ID if available
        const txMatch = stdout.match(/Transaction ID: (\w+)/);
        if (txMatch) {
          console.log(`🔗 Transaction ID: ${txMatch[1]}`);
        }

        resolve(stdout);
      });
    });
  });
}

// Verify deployment
function verifyDeployment() {
  return new Promise((resolve, reject) => {
    const verifyCommand = `${FLOW_CLI} accounts get ${TESTNET_ACCOUNT} --network=${NETWORK}`;
    
    console.log('🔍 Verifying NetflixNFT deployment...');
    
    exec(verifyCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error verifying deployment:', error.message);
        reject(error);
        return;
      }

      if (stdout.includes("Contract: 'NetflixNFT'")) {
        console.log('✅ NetflixNFT contract verification successful!');
        console.log('📝 Contract is now available on testnet');
        
        // Extract contract address
        const addressMatch = stdout.match(/Address: 0x(\w+)/);
        if (addressMatch) {
          console.log(`📍 Contract Address: 0x${addressMatch[1]}`);
        }
        
        resolve(true);
      } else {
        console.error('❌ NetflixNFT contract not found in account');
        reject(new Error('Contract verification failed'));
      }
    });
  });
}

// Main deployment process
async function main() {
  try {
    await deployNetflixNFT();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for block confirmation
    await verifyDeployment();
    
    console.log('\n🎉 NetflixNFT deployment completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Update your frontend to use the deployed contract address');
    console.log('2. Test minting Netflix subscriptions');
    console.log('3. Test the rental functionality');
    
  } catch (error) {
    console.error('\n💥 Deployment failed:', error.message);
    process.exit(1);
  }
}

main();

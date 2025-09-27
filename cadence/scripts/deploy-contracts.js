import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FLOW_CLI = 'flow'; // Ensure Flow CLI is installed and in PATH
const TESTNET_ACCOUNT = 'harshpro'; // Using your account from flow.json

const CONTRACTS = [
  {
    name: 'FlowPassNFT',
    path: './contracts/FlowPassNFT.cdc'
  },
  {
    name: 'DelegationNFT', 
    path: './contracts/DelegationNFT.cdc'
  },
  {
    name: 'SelfAttestationRegistry',
    path: './contracts/SelfAttestationRegistry.cdc'
  }
];

const DEPLOYMENT_ADDRESSES = {
  testnet: {
    FlowPassNFT: '1635dff04f103087', // Will be deployed to new account
    DelegationNFT: '1635dff04f103087', // Will be deployed to new account
    SelfAttestationRegistry: '1635dff04f103087' // Will be deployed to new account
  }
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function deployContract(contract, network = 'testnet') {
  return new Promise((resolve, reject) => {
    // Check if contract already exists, update if it does, add if it doesn't
    const checkCommand = `${FLOW_CLI} accounts get ${TESTNET_ACCOUNT} --network=${network}`;
    
    exec(checkCommand, (checkError, checkStdout, checkStderr) => {
      const contractExists = checkStdout.includes(`Contract: '${contract.name}'`);
      const command = contractExists 
        ? `${FLOW_CLI} accounts update-contract ${contract.path} --network=${network} --signer=${TESTNET_ACCOUNT}`
        : `${FLOW_CLI} accounts add-contract ${contract.path} --network=${network} --signer=${TESTNET_ACCOUNT}`;

      console.log(`${contractExists ? 'Updating' : 'Deploying'} ${contract.name}...`);
      console.log(`Command: ${command}`);

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error ${contractExists ? 'updating' : 'deploying'} ${contract.name}:`, error);
          reject(error);
          return;
        }

        console.log(`${contract.name} ${contractExists ? 'updated' : 'deployed'} successfully!`);
        console.log('Output:', stdout);

        // Set deployed address (using testnet account for all contracts)
        DEPLOYMENT_ADDRESSES[network][contract.name] = TESTNET_ACCOUNT;
        console.log(`${contract.name} available at: 0x${TESTNET_ACCOUNT}`);

        resolve(stdout);
      });
    });
  });
}

async function deployAllContracts(network = 'testnet') {
  console.log(`Starting deployment to ${network}...`);

  try {
    // Deploy contracts in dependency order
    for (const contract of CONTRACTS) {
      await deployContract(contract, network);
      // Wait between deployments to avoid rate limiting
      await sleep(2000);
    }

    console.log('\n🎉 All contracts deployed successfully!');
    console.log('\nDeployment Addresses:');
    Object.entries(DEPLOYMENT_ADDRESSES[network]).forEach(([name, address]) => {
      if (address) {
        console.log(`${name}: ${address}`);
      }
    });

    // Save deployment addresses to file
    const deploymentFile = path.join(__dirname, '..', `deployment-${network}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(DEPLOYMENT_ADDRESSES[network], null, 2));
    console.log(`\n📄 Deployment addresses saved to: ${deploymentFile}`);

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

// Check if Flow CLI is available
exec(`${FLOW_CLI} version`, (error) => {
  if (error) {
    console.error('❌ Flow CLI not found. Please install Flow CLI first.');
    console.log('Installation: https://developers.flow.com/tools/flow-cli/install');
    process.exit(1);
  }

  // Get network from command line args
  const network = process.argv[2] || 'testnet';

  if (!['testnet', 'mainnet'].includes(network)) {
    console.error('❌ Invalid network. Use "testnet" or "mainnet"');
    process.exit(1);
  }

  deployAllContracts(network);
});

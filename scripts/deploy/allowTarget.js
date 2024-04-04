const { ethers } = require('ethers');

require('dotenv').config();
const fundManagerABI = require('../../artifacts/contracts/multiswap-contracts/FundManager.sol/FundManager.json');

const fundManagerAddress = '0x5eBeF0bD015e4fAfe64172Ae00b9bB46a05906a7';

const foundryArbitrum = "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8";
const foundryBinance = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";
const foundryEthereum = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const foundryOptimism = "0x0b2c639c533813f4aa9d7837caf62653d097ff85";
const foundryAvalanche = "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E";

const optimismChainID = 10;
const AvalancheChainID = 43114;

const ethProvider = 'https://nd-611-696-948.p2pify.com/8a54d0bc389e645253087fd1a6c5fe3a';
const arbiProvider = 'https://nd-829-997-700.p2pify.com/790712c620e64556719c7c9f19ef56e3';
const bscProvider = 'https://nd-049-483-298.p2pify.com/819ef21ecdd17a29a2ed1e856c7980ec';

async function main() {
  // Assuming the command line arguments are: node allowTarget <network> 
  // For Binance: node allowTarget.js bsc, 
  // For Aribtrum: node allowTarget.js arbitrum, 
  // For Ethereum: node allowTarget.js ethereum
  
  const networkArg = process.argv[2];

  if (networkArg == 'ethereum') {
      const provider = new ethers.providers.JsonRpcProvider(ethProvider);
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY0 , provider);

      const fundManager = new ethers.Contract(fundManagerAddress, fundManagerABI.abi, provider);

      // Call allowTarget on FundManager with specified addresses
      const targetAllowed = await fundManager.connect(wallet).allowTarget(foundryEthereum, AvalancheChainID, foundryAvalanche);
      // Wait for the transaction receipt
      const receiptTargetAllowed = await targetAllowed.wait();
      
      if (receiptTargetAllowed.status == 1) {
          console.log("ETHEREUM: AllowTarget added successfully in FundManager!");
      } else {
          console.log("Transaction failed");
      }
      // Call allowTarget on FundManager with specified addresses
      const targetAllowed2 = await fundManager.connect(wallet).allowTarget(foundryEthereum, optimismChainID, foundryOptimism);
      // Wait for the transaction receipt
      const receiptTargetAllowed2 = await targetAllowed2.wait();
      
      if (receiptTargetAllowed2.status == 1) {
          console.log("ETHEREUM: AllowTarget added successfully in FundManager!");
      } else {
          console.log("Transaction failed");
      }

   } else if(networkArg == 'bsc') {
      const provider = new ethers.providers.JsonRpcProvider(bscProvider);
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY0 , provider);

      const fundManager = new ethers.Contract(fundManagerAddress, fundManagerABI.abi, provider);


      // Call allowTarget on FundManager with specified addresses
      const targetAllowed = await fundManager.connect(wallet).allowTarget(foundryBinance, AvalancheChainID, foundryAvalanche);
      // Wait for the transaction receipt
      const receiptTargetAllowed = await targetAllowed.wait();
      
      if (receiptTargetAllowed.status == 1) {
          console.log("BSC: AllowTarget added successfully in FundManager!");
      } else {
          console.log("Transaction failed");
      }
      // Call allowTarget on FundManager with specified addresses
      const targetAllowed2 = await fundManager.connect(wallet).allowTarget(foundryBinance, optimismChainID, foundryOptimism);
      // Wait for the transaction receipt
      const receiptTargetAllowed2 = await targetAllowed2.wait();
      
      if (receiptTargetAllowed2.status == 1) {
          console.log("BSC: AllowTarget added successfully in FundManager!");
      } else {
          console.log("Transaction failed");
      }

     } else if(networkArg == 'arbitrum') {

          const provider = new ethers.providers.JsonRpcProvider(arbiProvider);
          const wallet = new ethers.Wallet(process.env.PRIVATE_KEY0 , provider);

          const fundManager = new ethers.Contract(fundManagerAddress, fundManagerABI.abi, provider);

            // Call allowTarget on FundManager with specified addresses
          const targetAllowed = await fundManager.connect(wallet).allowTarget(foundryArbitrum, AvalancheChainID, foundryAvalanche);
          // Wait for the transaction receipt
          const receiptTargetAllowed = await targetAllowed.wait();
          
          if (receiptTargetAllowed.status == 1) {
              console.log("ARBITRUM: AllowTarget added successfully in FundManager!");
          } else {
              console.log("Transaction failed");
          }
          // Call allowTarget on FundManager with specified addresses
          const targetAllowed2 = await fundManager.connect(wallet).allowTarget(foundryArbitrum, optimismChainID, foundryOptimism);
          // Wait for the transaction receipt
          const receiptTargetAllowed2 = await targetAllowed2.wait();
          
          if (receiptTargetAllowed2.status == 1) {
              console.log("ARBITRUM: AllowTarget added successfully in FundManager!");
          } else {
              console.log("Transaction failed");
          }
      }

}

main();
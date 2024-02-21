const { ethers } = require('ethers');

// Import ABIs for contracts
const forgeManagerABI = require('MultiSwap/artifacts/contracts/multiswap-contracts/ForgeManager.sol/ForgeFundManager.json');
const fundManagerABI = require('MultiSwap/artifacts/contracts/multiswap-contracts/FundManager.sol/FundManager.json');
const fiberRouterABI = require("MultiSwap/artifacts/contracts/multiswap-contracts/FiberRouter.sol/FiberRouter.json");
const multiswapForgeABI = require('MultiSwap/artifacts/contracts/multiswap-contracts/MultiswapForge.sol/MultiswapForge.json');

// Replace these with your actual contract addresses
const forgeManagerAddress = '0x';
const multiswapForgeAddress = '0x';
const fiberRouterAddress = '0x';
const fundManagerAddress = '0x';
const foundryArbitrum = "0x";
const foundryBinance = "0x";
const signerAddress = "0x";
const gasWallet = "0x";
const binanceChainID = 56;
const arbitrumChainID = 42161;

async function main() {
  const bscProvider = 'https://bsc.meowrpc.com';

  const provider = new ethers.providers.JsonRpcProvider(bscProvider);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY0 , provider);

  // Connect to ForgeManager and MultiswapForge contracts
  const forgeManager = new ethers.Contract(forgeManagerAddress, forgeManagerABI.abi, provider);
  const multiswapForge = new ethers.Contract(multiswapForgeAddress, multiswapForgeABI.abi, provider);

  // Connect to FiberRouter and FundManager contracts
  const fiberRouter = new ethers.Contract(fiberRouterAddress, fiberRouterABI.abi, provider);
  const fundManager = new ethers.Contract(fundManagerAddress, fundManagerABI.abi, provider);

  // Call setRouter on ForgeManager with MultiswapForge address
  const forgeSet = await forgeManager.connect(wallet).setRouter(multiswapForge.address);
  // Wait for the transaction receipt
  const receiptForgeSet = await forgeSet.wait();
  
  if (receiptForgeSet.status == 1) {
      console.log("Forge added successfully in ForgeManager!");
  } else {
      console.log("Transaction failed");
  }

  // Call setRouter on FundManager with FiberRouter address
  const routerSet = await fundManager.connect(wallet).setRouter(fiberRouter.address);
  // Wait for the transaction receipt
  const receiptRouterSet = await routerSet.wait();
  
  if (receiptRouterSet.status == 1) {
      console.log("Router added successfully in FundManager!");
  } else {
      console.log("Transaction failed");
  }

  // Call allowTarget on FundManager with specified addresses
  const targetAllowed = await fundManager.connect(wallet).allowTarget(foundryBinance, arbitrumChainID, foundryArbitrum);
  // Wait for the transaction receipt
  const receiptTargetAllowed = await targetAllowed.wait();
  
  if (receiptTargetAllowed.status == 1) {
      console.log("AllowTarget added successfully in FundManager!");
  } else {
      console.log("Transaction failed");
  }

  // Call addSigner on FundManager with signer address
  const signerAdded = await fundManager.connect(wallet).addSigner(signerAddress);
  // Wait for the transaction receipt
  const receiptSignerAdded = await signerAdded.wait();
  
  if (receiptSignerAdded.status == 1) {
      console.log("Signer added successfully in FundManager!");
  } else {
      console.log("Transaction failed");
  }

  // Call addFoundryAsset on FundManager
  const foundryAdded = await fundManager.connect(wallet).addFoundryAsset(foundryBinance);
  // Wait for the transaction receipt
  const receiptFoundryAdded = await foundryAdded.wait();
  
  if (receiptFoundryAdded.status == 1) {
      console.log("USDC Foundry added successfully in FundManager!");
  } else {
      console.log("Transaction failed");
  }

  // Call addFoundryAsset on ForgeManager
  const forgeFoundryAdded = await forgeManager.connect(wallet).addFoundryAsset(foundryBinance);
  // Wait for the transaction receipt
  const receiptForgeFoundryAdded = await forgeFoundryAdded.wait();
  
  if (receiptForgeFoundryAdded.status == 1) {
      console.log("USDC Foundry added successfully in ForgeManager!");
  } else {
      console.log("Transaction failed");
  }

  // Call setGasWallet on FiberRouter with gasWallet address
  const gasWalletAdded = await fiberRouter.connect(wallet).setGasWallet(gasWallet);
  // Wait for the transaction receipt
  const receiptGasWalletAdded = await gasWalletAdded.wait();
  
  if (receiptGasWalletAdded.status == 1) {
      console.log("GasWallet added successfully in FiberRouter!");
  } else {
      console.log("Transaction failed");
  }

}

main();
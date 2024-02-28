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

const foundryArbitrum = "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8";
const foundryBinance = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";
const foundryEthereum = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"

const signerAddress = "0x";

const liquidityManager = "0x";
const liquidityManagerBot = "0x"
const withdrawalAddress = "0x"

const settlementManagerAddress = "0x";

// The wallet where the gas received from sourceNetwork will be transferred
const gasWallet = "0x";

// the address that is allowed to call the estimate gas fee for withdrawal functions
const gasEstimationAddress = "0x"

const binanceChainID = 56;
const ethereumChainID = 1;
const arbitrumChainID = 42161;

async function main() {
  const ethProvider = 'https://nd-611-696-948.p2pify.com/8a54d0bc389e645253087fd1a6c5fe3a';
  const arbiProvider = 'https://nd-829-997-700.p2pify.com/790712c620e64556719c7c9f19ef56e3';
  const bscProvider = 'https://rpc.tornadoeth.cash/bsc';

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
  const targetAllowed = await fundManager.connect(wallet).allowTarget(foundryBinance, ethereumChainID, foundryEthereum);
  // Wait for the transaction receipt
  const receiptTargetAllowed = await targetAllowed.wait();
  
  if (receiptTargetAllowed.status == 1) {
      console.log("AllowTarget added successfully in FundManager!");
  } else {
      console.log("Transaction failed");
  }


  // Call allowTarget on FundManager with specified addresses
  const targetAllowed2 = await fundManager.connect(wallet).allowTarget(foundryBinance, arbitrumChainID, foundryArbitrum);
  // Wait for the transaction receipt
  const receiptTargetAllowed2 = await targetAllowed2.wait();
  
  if (receiptTargetAllowed2.status == 1) {
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

  // Call addSigner on FundManager with signer address
  const gasEstimationAddressAdded = await multiswapForge.connect(wallet).setGasEstimationAddress(gasEstimationAddress);
  // Wait for the transaction receipt
  const receiptGasEstimationAddressAdded = await gasEstimationAddressAdded.wait();
  
  if (receiptGasEstimationAddressAdded.status == 1) {
      console.log("Gas Estimation Address added successfully in MultiSwapForge!");
  } else {
      console.log("Transaction failed");
  }

  // Call setLiquidityManagers on FundManager with liquidity manager addresses
  const liquidityManagerAdded = await fundManager.connect(wallet).setLiquidityManagers(liquidityManager, liquidityManagerBot);
  // Wait for the transaction receipt
  const receiptLiquidityManagerAdded = await liquidityManagerAdded.wait();
  
  if (receiptLiquidityManagerAdded.status == 1) {
      console.log("Liquidity Managers added successfully in FundManager!");
  } else {
      console.log("Transaction failed");
  }

  // Call setWithdrawalAddress on FundManager with liquidity withdrawal addresses
  const withdrawalAddressAdded = await fundManager.connect(wallet).setLiquidityManagers(withdrawalAddress);
  // Wait for the transaction receipt
  const receiptWithdrawalAddressAdded = await withdrawalAddressAdded.wait();
  
  if (receiptWithdrawalAddressAdded.status == 1) {
      console.log("Liquidity Withdrawal Address added successfully in FundManager!");
  } else {
      console.log("Transaction failed");
  }
  
  // Call setSettlementManager on FundManager with Settlement Manager address
  const settlementManagerAddressAdded = await fundManager.connect(wallet).setLiquidityManagers(settlementManagerAddress);
  // Wait for the transaction receipt
  const receiptSettlementManagerAddressAdded = await settlementManagerAddressAdded.wait();
  
  if (receiptSettlementManagerAddressAdded.status == 1) {
      console.log("Settlement Manager address added successfully in FundManager!");
  } else {
      console.log("Transaction failed");
  }
}

main();
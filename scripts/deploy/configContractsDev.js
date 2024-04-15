const { ethers } = require('ethers');
require('dotenv').config();

// Import ABIs for contracts
const forgeManagerABI = require('../../artifacts/contracts/multiswap-contracts/ForgeManager.sol/ForgeFundManager.json');
const fundManagerABI = require('../../artifacts/contracts/multiswap-contracts/FundManager.sol/FundManager.json');
const fiberRouterABI = require("../../artifacts/contracts/multiswap-contracts/FiberRouter.sol/FiberRouter.json");
const multiswapForgeABI = require('../../artifacts/contracts/multiswap-contracts/MultiswapForge.sol/MultiswapForge.json');

// Replace these with your actual contract addresses
const forgeManagerAddress = '';
const multiswapForgeAddress = '';

const fiberRouterAddress = '';
const fundManagerAddress = '';

const foundryArbitrum = "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8";
const foundryBinance = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";
const foundryEthereum = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const foundryOptimism = "0x0b2c639c533813f4aa9d7837caf62653d097ff85";
const foundryAvalanche = "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E";
const foundryBase = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const foundryScroll = "0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4";

const wethArbitrum = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1";
const wethBinance = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const wethEthereum = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const wethOptimism = "0x4200000000000000000000000000000000000006";
const wethAvalanche = "0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab";
const wethBase = "0x4200000000000000000000000000000000000006";
const wethScroll = "0x5300000000000000000000000000000000000004";

const oneInchAggregatorRouter = "0x1111111254EEB25477B68fb85Ed929f73A960582";

const signerAddress = "0xF81f80C04C421F98c06232D2DF7E2aC8790bb19B";

const liquidityManager = "0x5dAC22dB4dEaCfab7e9A0A1425f25D6B18e9839C";
const liquidityManagerBot = "0x9B7C800DCca6273CB6DDb861764cFB95BDAb15cc"
const withdrawalAddress = "0x1370172Ed69Ec231cDB8E59d928D42824094c0C6"

const settlementManagerAddress = "0x5912cE9327C2F8BE2Ffce1e8E521F6a65A870a19";

// The wallet where the gas received from sourceNetwork will be transferred
const gasWallet = "0xBFBFE0e25835625efa98161e3286Ca1290057E1a";

// the address that is allowed to call the estimate gas fee for withdrawal functions
const gasEstimationAddress = "0xF81f80C04C421F98c06232D2DF7E2aC8790bb19B"

const binanceChainID = 56;
const ethereumChainID = 1;
const arbitrumChainID = 42161;
const optimismChainID = 10;
const AvalancheChainID = 43114;
const baseChainID = 8453;
const scrollChainID = 534352;

async function main() {
  const ethProvider = 'https://nd-611-696-948.p2pify.com/8a54d0bc389e645253087fd1a6c5fe3a';
  const arbiProvider = 'https://nd-829-997-700.p2pify.com/790712c620e64556719c7c9f19ef56e3';
  const bscProvider = 'https://nd-049-483-298.p2pify.com/819ef21ecdd17a29a2ed1e856c7980ec';
  const opProvider = "https://optimism-mainnet.core.chainstack.com/7cb5109bd1c125224315d9b753cc0e45";
  const avalancheProvider = "https://nd-118-315-546.p2pify.com/048dd2e7493f4804ffed70b2acfffe8b/ext/bc/C/rpc";
  const baseProvider = "https://base-mainnet.core.chainstack.com/e7aa01c976c532ebf8e2480a27f18278";
  const scrollProvider = "https://scroll-mainnet.core.chainstack.com/26406aa9a6209c7577a5ab1ff15243cd";

  const provider = new ethers.providers.JsonRpcProvider(avalancheProvider);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY0 , provider);

  // Connect to ForgeManager and MultiswapForge contracts
  const forgeManager = new ethers.Contract(forgeManagerAddress, forgeManagerABI.abi, provider);
  const multiswapForge = new ethers.Contract(multiswapForgeAddress, multiswapForgeABI.abi, provider);

  // Connect to FiberRouter and FundManager contracts
  const fiberRouter = new ethers.Contract(fiberRouterAddress, fiberRouterABI.abi, provider);
  const fundManager = new ethers.Contract(fundManagerAddress, fundManagerABI.abi, provider);

  // Call setWETH on FundManager with WETH address
  const wethSet = await fiberRouter.connect(wallet).setWETH(wethAvalanche);
  // Wait for the transaction receipt
  const receiptWethSet = await wethSet.wait();
  
  if (receiptWethSet.status == 1) {
      console.log("WETH address added successfully in FiberRouter!");
  } else {
      console.log("Transaction failed");
  }

  // Call setRouter on ForgeManager with WETH address
  const wethForgeSet = await multiswapForge.connect(wallet).setWETH(wethAvalanche);
  // Wait for the transaction receipt
  const receiptWethForgeSet = await wethForgeSet.wait();
  
  if (receiptWethForgeSet.status == 1) {
      console.log("WETH address added successfully in MultiSwapForge!");
  } else {
      console.log("Transaction failed");
  }

  // Call setPool on FiberRouter with FundManager address
  const poolFundManagerSet = await fiberRouter.connect(wallet).setPool(fundManagerAddress);
  // Wait for the transaction receipt
  const receiptPoolFundManagerSet = await poolFundManagerSet.wait();
  
  if (receiptPoolFundManagerSet.status == 1) {
      console.log("Pool Fund Manager address added successfully in FiberRouter!");
  } else {
      console.log("Transaction failed");
  }

  // Call setPool on MultiSwapForge with ForgeManager address
  const poolForgeManagerSet = await multiswapForge.connect(wallet).setPool(forgeManagerAddress);
  // Wait for the transaction receipt
  const receiptPoolForgeManagerSet = await poolForgeManagerSet.wait();
  
  if (receiptPoolForgeManagerSet.status == 1) {
      console.log("Pool Forge Manager address added successfully in MultiSwap Forge!");
  } else {
      console.log("Transaction failed");
  }

  // Call setOneInchAggregatorRouter on FiberRouter with oneInchAggregatorRouter address
  const oneInchAddressSet = await fiberRouter.connect(wallet).setOneInchAggregatorRouter(oneInchAggregatorRouter);
  // Wait for the transaction receipt
  const receiptOneInchAddressSet = await oneInchAddressSet.wait();
  
  if (receiptOneInchAddressSet.status == 1) {
      console.log("OneInch Aggregator address added successfully in FiberRouter!");
  } else {
      console.log("Transaction failed");
  }

  // Call setOneInchAggregatorRouter on MultiSwap Forge with oneInchAggregatorRouter address
  const oneInchAddressForgeSet = await multiswapForge.connect(wallet).setOneInchAggregatorRouter(oneInchAggregatorRouter);
  // Wait for the transaction receipt
  const receiptOneInchAddressForgeSet = await oneInchAddressForgeSet.wait();
  
  if (receiptOneInchAddressForgeSet.status == 1) {
      console.log("OneInch Aggregator address added successfully in MultiSwap Forge!");
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

  // Call setRouter on ForgeManager with MultiswapForge address
  const forgeSet = await forgeManager.connect(wallet).setRouter(multiswapForge.address);
  // Wait for the transaction receipt
  const receiptForgeSet = await forgeSet.wait();
  
  if (receiptForgeSet.status == 1) {
      console.log("Forge added successfully in ForgeManager!");
  } else {
      console.log("Transaction failed");
  }
  
  // Call allowTarget on FundManager with specified addresses
  const targetAllowed = await fundManager.connect(wallet).allowTarget(foundryAvalanche, ethereumChainID, foundryEthereum);
  // Wait for the transaction receipt
  const receiptTargetAllowed = await targetAllowed.wait();
  
  if (receiptTargetAllowed.status == 1) {
      console.log("AllowTarget added successfully in FundManager!");
  } else {
      console.log("Transaction failed");
  }


  // Call allowTarget on FundManager with specified addresses
  const targetAllowed2 = await fundManager.connect(wallet).allowTarget(foundryAvalanche, binanceChainID, foundryBinance);
  // Wait for the transaction receipt
  const receiptTargetAllowed2 = await targetAllowed2.wait();
  
  if (receiptTargetAllowed2.status == 1) {
      console.log("AllowTarget added successfully in FundManager!");
  } else {
      console.log("Transaction failed");
  }

  // Call allowTarget on FundManager with specified addresses
  const targetAllowed3 = await fundManager.connect(wallet).allowTarget(foundryAvalanche, arbitrumChainID, foundryArbitrum);
  // Wait for the transaction receipt
  const receiptTargetAllowed3 = await targetAllowed3.wait();
  
  if (receiptTargetAllowed3.status == 1) {
      console.log("AllowTarget added successfully in FundManager!");
  } else {
      console.log("Transaction failed");
  }

  // Call allowTarget on FundManager with specified addresses
  const targetAllowed4 = await fundManager.connect(wallet).allowTarget(foundryAvalanche, optimismChainID, foundryOptimism);
  // Wait for the transaction receipt
  const receiptTargetAllowed4 = await targetAllowed4.wait();
  
  if (receiptTargetAllowed4.status == 1) {
      console.log("AllowTarget added successfully in FundManager!");
  } else {
      console.log("Transaction failed");
  }

  // Call allowTarget on FundManager with specified addresses
  const targetAllowed5 = await fundManager.connect(wallet).allowTarget(foundryAvalanche, baseChainID, foundryBase);
  // Wait for the transaction receipt
  const receiptTargetAllowed5 = await targetAllowed5.wait();
  
  if (receiptTargetAllowed5.status == 1) {
      console.log("AllowTarget added successfully in FundManager!");
  } else {
      console.log("Transaction failed");
  }

  // Call allowTarget on FundManager with specified addresses
  const targetAllowed6 = await fundManager.connect(wallet).allowTarget(foundryAvalanche, scrollChainID, foundryScroll);
  // Wait for the transaction receipt
  const receiptTargetAllowed6 = await targetAllowed6.wait();
  
  if (receiptTargetAllowed6.status == 1) {
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
  const foundryAdded = await fundManager.connect(wallet).addFoundryAsset(foundryAvalanche);
  // Wait for the transaction receipt
  const receiptFoundryAdded = await foundryAdded.wait();
  
  if (receiptFoundryAdded.status == 1) {
      console.log("USDC Foundry added successfully in FundManager!");
  } else {
      console.log("Transaction failed");
  }

  // Call addFoundryAsset on ForgeManager
  const forgeFoundryAdded = await forgeManager.connect(wallet).addFoundryAsset(foundryAvalanche);
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
  const withdrawalAddressAdded = await fundManager.connect(wallet).setWithdrawalAddress(withdrawalAddress);
  // Wait for the transaction receipt
  const receiptWithdrawalAddressAdded = await withdrawalAddressAdded.wait();
  
  if (receiptWithdrawalAddressAdded.status == 1) {
      console.log("Liquidity Withdrawal Address added successfully in FundManager!");
  } else {
      console.log("Transaction failed");
  }
  
  // Call setSettlementManager on FundManager with Settlement Manager address
  const settlementManagerAddressAdded = await fundManager.connect(wallet).setSettlementManager(settlementManagerAddress);
  // Wait for the transaction receipt
  const receiptSettlementManagerAddressAdded = await settlementManagerAddressAdded.wait();
  
  if (receiptSettlementManagerAddressAdded.status == 1) {
      console.log("Settlement Manager address added successfully in FundManager!");
  } else {
      console.log("Transaction failed");
  }
}

main();
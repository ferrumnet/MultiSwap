    const { ethers } = require('ethers');
    require('dotenv').config();
    // Import ABIs for contracts
    const fundManagerABI = require('../../artifacts/contracts/multiswap-contracts/FundManager.sol/FundManager.json').abi;
    const fiberRouterABI = require("../../artifacts/contracts/multiswap-contracts/FiberRouter.sol/FiberRouter.json").abi;
    const cctpFundManagerABI = require('../../artifacts/contracts/multiswap-contracts/CCTPFundManager.sol/CCTPFundManager.json').abi;

async function interactWithContracts() {
    const arbiProvider = '';
    const avalancheProvider = '';

  
    const provider = new ethers.providers.JsonRpcProvider(arbiProvider);
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY0 , provider);

   // Contract addresses
   const fiberRouterAddress = '';
   const cctpFundManagerAddress = '';
   const fundManagerAddress = '';

   const avaxUSDC = '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E';
   const arbiUSDC = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
   const avaxMessenger = '0x6b25532e1060ce10cc3b0a99e5683b91bfde6982';
   const arbiMessenger = '0x19330d10D9Cc8751218eaf51E8885D058642E08A';
   const avaxDomain = 1;
   const arbiDomain = 3;


   const cctpTokenMessenger = arbiMessenger;
   const usdcToken = arbiUSDC;
   const sourceCCTPFundManager = cctpFundManagerAddress;
   const targetCCTPFundManager = '';

   const fiberRouter = new ethers.Contract(fiberRouterAddress, fiberRouterABI, signer);
   const cctpFundManager = new ethers.Contract(cctpFundManagerAddress, cctpFundManagerABI, signer);
   const fundManager = new ethers.Contract(fundManagerAddress, fundManagerABI, signer);

    // Functions to interact with contracts
    async function setPoolAddress(poolAddress) {
        await fiberRouter.setPool(poolAddress);
        console.log('Pool address set successfully.');
    }

    async function initCCTP(cctpTokenMessenger, usdcToken, sourceCCTPFundManager, targetCCTPFundManager) {
        await fiberRouter.initCCTP(cctpTokenMessenger, usdcToken, sourceCCTPFundManager, targetCCTPFundManager);
        console.log('CCTP initialized successfully.');
    }

    async function setFiberRouter(fiberRouter) {
        await cctpFundManager.setFiberRouter(fiberRouter);
        console.log('FiberRouter address set successfully.');
    }

    async function setRouter(router) {
        await fundManager.setRouter(router);
        console.log('Router address set successfully.');
    }

    // Example calls
    await setPoolAddress(fundManagerAddress);
    await initCCTP(cctpTokenMessenger, usdcToken, sourceCCTPFundManager, targetCCTPFundManager);
    await setFiberRouter(fiberRouterAddress);
    await setRouter(fiberRouterAddress);
}

// Call the function to interact with contracts
interactWithContracts().then(() => console.log('All interactions completed.'));

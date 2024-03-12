const { ethers } = require('ethers');

// Import ABIs for contracts
const forgeManagerABI = require('../../artifacts/contracts/multiswap-contracts/ForgeManager.sol/ForgeFundManager.json');
const fundManagerABI = require('../../artifacts/contracts/multiswap-contracts/FundManager.sol/FundManager.json');
const fiberRouterABI = require("../../artifacts/contracts/multiswap-contracts/FiberRouter.sol/FiberRouter.json");
const multiswapForgeABI = require('../../artifacts/contracts/multiswap-contracts/MultiswapForge.sol/MultiswapForge.json');

// Replace these with your actual contract addresses
const forgeManagerAddress = '0x7655eE1bd794b0Fe4b9B4D477B0F5cCABD78137c';
const multiswapForgeAddress = '0x1B718d378F28AF83b292eFF48213cCd9Aa025E72';

const multiswapForgeAddressBSC = '0x07700CA03f6f23E7B873C411a600eddf18851859';

const multiSwapForgeAddressARBI = '0x16908c9893516eF098D05268176BaC9D42ff7789';

const fiberRouterAddress = '0x7FfD92b850c5660FB40BD5Efa4f24eb22665E4c4';
const fundManagerAddress = '0x985824b8623e523162122461e081721b4bcc778b';
const foundryArbitrum = "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8";
const foundryBinance = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";
const foundryEthereum = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
const signerAddress = "0xF81f80C04C421F98c06232D2DF7E2aC8790bb19B";
const gasWallet = "0xBFBFE0e25835625efa98161e3286Ca1290057E1a";
const binanceChainID = 56;
const ethereumChainID = 1;
const arbitrumChainID = 42161;

async function main() {
  const ethProvider = 'https://nd-611-696-948.p2pify.com/8a54d0bc389e645253087fd1a6c5fe3a';
  const arbiProvider = 'https://nd-829-997-700.p2pify.com/790712c620e64556719c7c9f19ef56e3';
const bscProvider = 'https://bsc.meowrpc.com';

  const provider = new ethers.providers.JsonRpcProvider(arbiProvider);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY0 , provider);

  const multiswapForge = new ethers.Contract(multiSwapForgeAddressARBI, multiswapForgeABI.abi, provider);

  const amount = "10000000000000000";
  const gasLimit = 500000;
  const estimatedGas = await multiswapForge.connect(wallet).estimateGas.withdrawSignedForGasEstimation(
    "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", 
    "0xeedfdd620629c7432970d22488124fc92ad6d426", 
    amount,  
    "0xa4e54807a142df60d6603016c2d68813de3752d447cb122f80845e9c57e9ff7e",
    1709409455,
    "0xb1c5430170238b5930bdbf59d743943040e61e9cabe2d15ae0ab71cfe0cab967648e975e4d4ddfa85539b66d5d3858e40c3c33d867431db8f04a139f02c02b751b"
    );

    /*
0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48 0xeedfdd620629c7432970d22488124fc92ad6d426 10000 0x55dd577e92a16403604ab1409c02bc46aabb5e281566fd5853fa7cf829158b78 1709402649 0xccd60be4d19cc3a7c2e299180f9a40de13ab9e5f2e069dfec43db1db9cc122984773952e007aa8c8c34cf86c7d4293808a5f98119efa259b6d1e0cb660154b591b
    */

  // console.log("Tx: ", estimatedGas);

  // const estimatedGas = await multiswapForge.connect(wallet).withdrawSignedAndSwapOneInchForGasEstimation(
  //   "0xeedfdd620629c7432970d22488124fc92ad6d426", 
  //   "10000000000000000", 
  //   "133798052122956414",  
  //   "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
  //   "0xa719b8ab7ea7af0ddb4358719a34631bb79d15dc",
  //   "0xf78dc253000000000000000000000000eedfdd620629c7432970d22488124fc92ad6d4260000000000000000000000008ac76a51cc950d9822d68b83fe1ad97b32cd580d000000000000000000000000000000000000000000000000002386f26fc1000000000000000000000000000000000000000000000000000001db589e986d927e00000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000200000000000000003b7c4580578e8cec62666d2750d92ecc70be0961ff3ab26980000000000000003b7c45809faa4d36d9d7158b15f408bf7357288d6ad8bc0477d4f1b0",
  //   "0x163a2d22be28517c9af40399ebc5aee25117c121cc01d67ecc9e71b637ec9f18",
  //   1709408964,
  //   "0x9cef8ea5f763526ea1e0a9e67e0d57fd7ac769fd3b7e732bf0fdfc63fd2a8a625845722b4c1a693e91a3bcfc487d370af5ba39b39ea32d0fcad36be5b2d0d47a1b"
  // );
  // console.log("Tx: ", estimatedGas);

  console.log("Gas estimation Raw:", estimatedGas);
  console.log("Gas estimation:", estimatedGas.toString());

  const gasPrice = await getGasPriceFromAPI();
  const gasCostWei = estimatedGas.mul(gasPrice);
  console.log("gas cost in wei: ", gasCostWei);

  // Convert gas cost to ethers
  const gasCostEther = ethers.utils.formatUnits(gasCostWei, "ether");
  
  console.log("Estimated Gas Cost:", gasCostEther);


    // // Example usage:
    // const transactionHash = '0x57d934d4b4c4cb29bbcd9b723161880af29899dcef72a992e1da2c8ac5acf620';
    
    // getGasUsed(transactionHash, ethProvider)
    //   .then((gasUsed) => console.log(`Gas used: ${gasUsed}`))
    //   .catch((error) => console.error(`Error: ${error.message}`));

}

  async function getGasPriceFromAPI() {
    try {
        const ethProvider = 'https://nd-611-696-948.p2pify.com/8a54d0bc389e645253087fd1a6c5fe3a';
        const provider = new ethers.providers.JsonRpcProvider(ethProvider);

        // Get the current gas price
        const gasPrice = await provider.getGasPrice();
          
        // Convert gas price to Gwei for display
        const gasPriceInGwei = ethers.utils.formatUnits(gasPrice, "gwei");

        console.log("Current Gas Price (Gwei):", gasPriceInGwei);
        console.log("Current Gas Price (Wei):", gasPrice.toString());

        return gasPrice;
    } catch (error) {
      console.error("Error fetching gas price:", error);
    }
  }


async function getGasUsed(txHash, providerUrl) {
    const provider = new ethers.providers.JsonRpcProvider(providerUrl);
    const txReceipt = await provider.getTransactionReceipt(txHash);
  
    if (txReceipt) {
      return txReceipt.gasUsed.toString();
    } else {
      return 'Transaction receipt not found. Please check if the transaction hash is correct.';
    }
  }
  



main();
    const { ethers } = require('hardhat');
    const { BigNumber } = require('ethers');
    const fiberRouterABI = require("../../artifacts/contracts/multiswap-contracts/FiberRouter.sol/FiberRouter.json").abi;

    const arbiProvider = '';
    const avalancheProvider = '';

    const provider = new ethers.providers.JsonRpcProvider(arbiProvider);
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY0 , provider);

    // Contract addresses
    const fiberRouterAddress = '';
    const avaxUSDC = '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E';
    const arbiUSDC = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
    const avaxChainID = 43114;
    const arbiChainID = 42161;

    const targetNetwork = avaxChainID; 
    const targetAddress = '';
    const withdrawalData = ''
    const swapCCTP = true;

    const tokenAddress = arbiUSDC;
    const targetToken = avaxUSDC;

    const fiberRouter = new ethers.Contract(fiberRouterAddress, fiberRouterABI, signer);

    async function main() {
      const amount = ethers.utils.parseUnits('2', 6); // value with decimal point

      const avaxDomain = 1;
      const arbiDomain = 3;

      const targetNetworkDomain = avaxDomain;

      // Call the swap function and pass the gas value
      const txSwap = await fiberRouter.swap(
        tokenAddress,
        amount,
        targetNetwork,
        targetNetworkDomain,
        targetToken,
        targetAddress,
        withdrawalData,
        swapCCTP,
        { value: ethers.utils.parseEther('0.00001') }
    );

      // Wait for the transaction receipt
      const txSwapReceipt = await txSwap.wait();
    
      if (txSwapReceipt.status == 1) {
          console.log('CCTP USDC Swap is Successful: ', txSwap.hash);
      } else {
          console.log("Swap Transaction failed");
      }
  }

  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
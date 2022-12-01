const { ethers } = require("ethers");
const axios = require("axios");
require("dotenv").config();
const fundManagerAbi = require("../artifacts/contracts/upgradeable-Bridge/FundManager.sol/FundManager.json");
const fiberRouterAbi = require("../artifacts/contracts/upgradeable-Bridge/FiberRouter.sol/FiberRouter.json");
const tokenAbi = require("../artifacts/contracts/token/Token.sol/Token.json");
const routerAbi = require("../artifacts/contracts/common/uniswap/IUniswapV2Router02.sol/IUniswapV2Router02.json");
const {
  goerliFundManager,
  bscFundManager,
  goerliFiberRouter,
  bscFiberRouter,
  bscRouter,
  goerliRouter,
  bscUsdt,
  goerliUsdt,
  bscCake,
  goerliUsdc,
  bscAda,
  bscUsdc,
  goerliAda,
  targetChainId,
  sourceChainId,
} = require("../Network");
const toWei = (i) => ethers.utils.parseEther(i);
const toEther = (i) => ethers.utils.formatEther(i);

//goerli rpc
const sourceNetwork = process.env.GOERLI_TESTNET_RPC;
//bsc rpc
const targetNetwork = process.env.BINANCE_TESTNET_RPC;

//network providers
const sourceProvider = new ethers.providers.JsonRpcProvider(sourceNetwork);
const targetProvider = new ethers.providers.JsonRpcProvider(targetNetwork);

// user wallet
const signer = new ethers.Wallet(process.env.PRI_KEY);
const sourceSigner = signer.connect(sourceProvider);
const targetSigner = signer.connect(targetProvider);

// usdt token on goerli and bsc networks as Foundry asset
const sourceFoundryTokenAddress = goerliUsdt; //goerli usdt
const targetFoundryTokenAddress = bscUsdt; //bsc usdt

//source Foundry token contract
const sourceFoundryTokenContract = new ethers.Contract(
  sourceFoundryTokenAddress,
  tokenAbi.abi,
  sourceProvider
);

//target Foundry token contract
const targetFoundryTokenContract = new ethers.Contract(
  targetFoundryTokenAddress,
  tokenAbi.abi,
  targetProvider
);

//goerli and bsc dex address
let sourceRouterAddress = goerliRouter; //goerli router dex
let targetRouterAddress = bscRouter; //bsc router dex

//source dex contract on goerli
const sourceDexContract = new ethers.Contract(
  sourceRouterAddress,
  routerAbi.abi,
  sourceProvider
);

//target dex contract on bsc
const targetDexContract = new ethers.Contract(
  targetRouterAddress,
  routerAbi.abi,
  targetProvider
);

// goerli fundManager contract
const sourcefundMangerAddress = goerliFundManager;
// bsc fundManager contract
const targetFundManagerAddress = bscFundManager;

// goerli fund manager contract
const sourceFundMangerContract = new ethers.Contract(
  sourcefundMangerAddress,
  fundManagerAbi.abi,
  sourceProvider
);

// bsc fund manager contract
const targetFundMangerContract = new ethers.Contract(
  targetFundManagerAddress,
  fundManagerAbi.abi,
  targetProvider
);

// goerli fiberRouter contract
const sourceFiberRouterAddress = goerliFiberRouter;
// bsc fiberRouter contract
const targetFiberRouterAddress = bscFiberRouter;

// goerli fund manager contract
const sourceFiberRouterContract = new ethers.Contract(
  sourceFiberRouterAddress,
  fiberRouterAbi.abi,
  sourceProvider
);

// bsc fund manager contract
const targetFiberRouterContract = new ethers.Contract(
  targetFiberRouterAddress,
  fiberRouterAbi.abi,
  targetProvider
);

class Fiber {
  constructor() {}

  //check the requested token exist on the Source network Fund Manager
  async sourceFACCheck(tokenAddress) {
    const isSourceTokenFoundryAsset =
      await sourceFundMangerContract.isFoundryAsset(tokenAddress);
    return isSourceTokenFoundryAsset;
  }

  //check the requested token exist on the Source network Fund Manager
  async targetFACCheck(tokenAddress, amount) {
    const targetTokenContract = new ethers.Contract(
      tokenAddress,
      tokenAbi.abi,
      targetProvider
    );
    const isTargetTokenFoundryAsset =
      await targetFundMangerContract.isFoundryAsset(tokenAddress);
    const targetFoundryAssetLiquidity = await targetTokenContract.balanceOf(
      targetFundMangerContract.address
    );
    if (
      isTargetTokenFoundryAsset === true &&
      Number(targetFoundryAssetLiquidity) > Number(amount)
    ) {
      return true;
    } else {
      return false;
    }
  }

  //check source token is Foundry asset
  async isSourceRefineryAsset(tokenAddress, amount) {
    try {
      const isTokenFoundryAsset = await this.sourceFACCheck(tokenAddress);

      let path = [tokenAddress, sourceFoundryTokenAddress];
      const amounts = await sourceDexContract.getAmountsOut(amount, path);
      const amountsOut = amounts[1];
      if (isTokenFoundryAsset == false && Number(amountsOut) > 0) {
        return true;
      }
    } catch (error) {
      return false;
    }
  }

  //check source toke is Foundry asset
  async isTargetRefineryAsset(tokenAddress, amount) {
    try {
      const isTokenFoundryAsset = await this.targetFACCheck(
        tokenAddress,
        amount
      );

      let path = [targetFoundryTokenAddress, tokenAddress];
      const amounts = await targetDexContract.getAmountsOut(amount, path);
      const amountsOut = amounts[1];
      if (isTokenFoundryAsset == false && Number(amountsOut) > 0) {
        return true;
      }
    } catch (error) {
      return false;
    }
  }

  //swap Foundry asset on two networks
  async MultiSwap(sourcetokenAddress, targetTokenAddress, amount) {
    const sourceTokenContract = new ethers.Contract(
      sourcetokenAddress,
      tokenAbi.abi,
      sourceProvider
    );
    const isFoundryAsset = await this.sourceFACCheck(sourcetokenAddress);
    const isRefineryAsset = await this.isSourceRefineryAsset(
      sourcetokenAddress,
      amount
    );

    let receipt;
    let sourceBridgeAmount;
    if (isFoundryAsset) {
      console.log("SN-1: Source Token is Foundry Asset");
      console.log("SN-2: Add Foundry Asset in Source Network FundManager");

      await sourceTokenContract
        .connect(sourceSigner)
        .approve(sourceFiberRouterContract.address, amount);
      const swapResult = await sourceFiberRouterContract
        .connect(sourceSigner)
        .swap(
          sourcetokenAddress,
          amount,
          targetChainId,
          targetFoundryTokenAddress,
          targetSigner.address,
          { gasLimit: 1000000 }
        );
      //wait until the transaction be completed
      sourceBridgeAmount = amount;
      receipt = await swapResult.wait();
    } else if (isRefineryAsset) {
      console.log("SN-1: Source Token is Refinery Asset");
      console.log("SN-2: Swap Refinery Asset to Foundry Asset ...");
      //swap Refinery token to the Foundry token
      let path = [sourcetokenAddress, sourceFoundryTokenAddress];

      const amounts = await sourceDexContract.getAmountsOut(amount, path);
      const amountsOut = amounts[1];
      sourceBridgeAmount = amountsOut;
      await sourceTokenContract
        .connect(sourceSigner)
        .approve(sourceFiberRouterContract.address, amount);
      const swapResult = await sourceFiberRouterContract
        .connect(sourceSigner)
        .swapAndCross(
          sourceDexContract.address,
          amount,
          amountsOut,
          path,
          "1669318064", // deadline
          targetNetworkId,
          targetFoundryTokenAddress,
          {
            gasLimit: 1000000,
          }
        );
      //wait until the transaction be completed
      receipt = await swapResult.wait();
    } else {
      console.log("SN-1: Source Token is Ionic Asset");
      console.log("SN-2: Swap Ionic Asset to Foundry Asset ...");
      //swap Refinery token to the Foundry token
      let path = [sourcetokenAddress, goerliUsdc, sourceFoundryTokenAddress];

      const amounts = await sourceDexContract.getAmountsOut(amount, path);
      const amountsOut = amounts[amounts.length - 1];
      sourceBridgeAmount = amountsOut;
      await sourceTokenContract
        .connect(sourceSigner)
        .approve(sourceFiberRouterContract.address, amount);
      const swapResult = await sourceFiberRouterContract
        .connect(sourceSigner)
        .swapAndCross(
          sourceDexContract.address,
          amount,
          amountsOut,
          path,
          "1669318064", // deadline
          targetNetworkId,
          targetFoundryTokenAddress,
          {
            gasLimit: 1000000,
          }
        );
      //wait until the transaction be completed
      receipt = await swapResult.wait();
    }
    if (receipt.status == 1) {
      console.log(
        "SUCCESS: Assets are successfully Swapped in Source Network !"
      );
      console.log("Cheers! your bridge and swap was successful !!!");
      console.log("Transaction hash is: ", swapResult.hash);
      const isTargetTokenFoundry = await this.targetFACCheck(
        targetTokenAddress,
        sourceBridgeAmount
      );
      if (isTargetTokenFoundry === true) {
        console.log("TN-1: Target Token is Foundry Asset");
        console.log("TN-2: Withdraw Foundry Asset...");
        //if target token is Foundry asset
        const swapResult = await targetFiberRouterContract
          .connect(targetSigner)
          .withdraw(
            targetFoundryTokenAddress, //token address on network 2
            signer.address, //reciver
            sourceBridgeAmount, //targetToken amount
            { gasLimit: 1000000 }
          );

        const receipt = await swapResult.wait();
        if (receipt.status == 1) {
          console.log(
            "SUCCESS: Foundry Assets are Successfully Withdrawn on Tource Network !"
          );
          console.log("Cheers! your bridge and swap was successful !!!");
          console.log("Transaction hash is: ", swapResult.hash);
        }
      } else {
        const isTargetRefineryToken = await this.isTargetRefineryAsset(
          targetTokenAddress,
          sourceBridgeAmount
        );
        if (isTargetRefineryToken == true) {
          console.log("TN-1: Target token is Refinery Asset");

          console.log(
            "TN-2: Withdraw and Swap Foundry Asset to Target Token ...."
          );
          let path2 = [targetFoundryTokenAddress, targetTokenAddress];
          const amounts2 = await targetDexContract.getAmountsOut(
            sourceBridgeAmount,
            path2
          );
          const amountsOut2 = amounts2[1];
          const swapResult2 = await targetFiberRouterContract
            .connect(targetSigner)
            .withdrawAndSwap(
              signer.address,
              targetRouterAddress,
              sourceBridgeAmount,
              amountsOut2,
              path2,
              "1669318064",
              {
                gasLimit: 1000000,
              }
            );
          const receipt2 = await swapResult2.wait();
          if (receipt2.status == 1) {
            console.log(
              "SUCCESS: Foundry Assets are Successfully swapped to Target Token !"
            );
            console.log("Cheers! your bridge and swap was successful !!!");
            console.log("Transaction hash is: ", swapResult2.hash);
          }
        } else {
          console.log("TN-1: Target Token is Ionic Asset");

          console.log(
            "TN-2: Withdraw and Swap Foundry Token to Target Token ...."
          );
          let path2 = [targetFoundryTokenAddress, bscUsdc, targetTokenAddress];
          const amounts2 = await targetDexContract.getAmountsOut(
            sourceBridgeAmount,
            path2
          );
          const amountsOut2 = amounts2[amounts2.length - 1];
          const swapResult2 = await targetFiberRouterContract
            .connect(targetSigner)
            .withdrawAndSwap(
              signer.address,
              targetRouterAddress,
              sourceBridgeAmount,
              amountsOut2,
              path2,
              "1669318064",
              {
                gasLimit: 1000000,
              }
            );
          const receipt2 = await swapResult2.wait();
          if (receipt2.status == 1) {
            console.log(
              "TN-3: Successfully Swapped Foundry Token to Target Token"
            );
            console.log("Cheers! your bridge and swap was successful !!!");
            console.log("Transaction hash is: ", swapResult2.hash);
          }
        }
      }
    }
  }
}
const fiber = new Fiber();
// fiber.MultiSwap(
//   "0x93e7a4C6FF5f5D786a33076c8F9D380E1bbA7E90", // goerli ada
//   "0xFa60D973F7642B748046464e165A65B7323b0DEE", // bsc cake
//   "10000000000000000000"
// );

fiber.MultiSwap(
  "0x636b346942ee09Ee6383C22290e89742b55797c5", // goerli ada
  "0xD069d62C372504d7fc5f3194E3fB989EF943d084", // bsc cake
  "10000000000000000000"
);
/*
async function console2(){ 
  const swapResult = await isTargetRefineryAsset("0xFa60D973F7642B748046464e165A65B7323b0DEE", "10000000000000000000");
  console.log(swapResult);
}

console2();
*/

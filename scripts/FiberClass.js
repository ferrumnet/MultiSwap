const { ethers } = require("ethers");
const axios = require("axios");
require("dotenv").config();
const fundManagerAbi = require("../artifacts/contracts/upgradeable-Bridge/FundManager.sol/FundManager.json");
const fiberRouterAbi = require("../artifacts/contracts/upgradeable-Bridge/FiberRouter.sol/FiberRouter.json");
const tokenAbi = require("../artifacts/contracts/token/Token.sol/Token.json");
const routerAbi = require("../artifacts/contracts/common/uniswap/IUniswapV2Router02.sol/IUniswapV2Router02.json");
const {
  bscChainId,
  goerliChainId,
  goerliRPC,
  bscRPC,
  goerliFundManager,
  bscFundManager,
  goerliFiberRouter,
  bscFiberRouter,
  bscRouter,
  goerliRouter,
  bscUsdt,
  goerliUsdt,
  bscCake,
  goerliCake,
  goerliUsdc,
  bscUsdc,
  bscAda,
  goerliAda,
  bscLink,
  goerliLink,
  bscUsdtOracle,
  goerliUsdtOracle,
  bscLinkOracle,
  goerliLinkOracle,
  goerliAave,
  bscAave,
  networks,
  goerliCudos,
  bscCudos,
  goerliWeth,
} = require("../../../../../Users/mac/Downloads/multichain/Network");
const toWei = (i) => ethers.utils.parseEther(i);
const toEther = (i) => ethers.utils.formatEther(i);

// user wallet
const signer = new ethers.Wallet(process.env.PRIVATE_KEY0);

class Fiber {
  constructor() {}
  //check the requested token exist on the Source network Fund Manager
  async sourceFACCheck(sourceNetwork, tokenAddress, amount) {
    const sourceTokenContract = new ethers.Contract(
      tokenAddress,
      tokenAbi.abi,
      sourceNetwork.provider
    );
    const isSourceTokenFoundryAsset =
      await sourceNetwork.fundManagerContract.isFoundryAsset(tokenAddress);
    const sourceFoundryAssetLiquidity = await sourceTokenContract.balanceOf(
      sourceNetwork.fundManager
    );
    if (
      isSourceTokenFoundryAsset === true &&
      Number(sourceFoundryAssetLiquidity) > Number(amount)
    ) {
      return true;
    } else {
      return false;
    }
  }

  //check the requested token exist on the Source network Fund Manager
  async targetFACCheck(targetNetwork, tokenAddress, amount) {
    const targetTokenContract = new ethers.Contract(
      tokenAddress,
      tokenAbi.abi,
      targetNetwork.provider
    );
    const isTargetTokenFoundryAsset =
      await targetNetwork.fundManagerContract.isFoundryAsset(tokenAddress);
    const targetFoundryAssetLiquidity = await targetTokenContract.balanceOf(
      targetNetwork.fundManagerContract.address
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

  //check source toke is foundry asset
  async isSourceRefineryAsset(sourceNetwork, tokenAddress, amount) {
    try {
      const isTokenFoundryAsset = await this.sourceFACCheck(
        sourceNetwork,
        tokenAddress,
        amount
      );

      let path = [tokenAddress, sourceNetwork.foundryTokenAddress];
      const amounts = await sourceNetwork.dexContract.getAmountsOut(
        amount,
        path
      );
      const amountsOut = amounts[1];
      if (isTokenFoundryAsset == false && Number(amountsOut) > 0) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  //check source toke is foundry asset
  async isTargetRefineryAsset(targetNetwork, tokenAddress, amount) {
    try {
      const isTokenFoundryAsset = await this.targetFACCheck(
        targetNetwork,
        tokenAddress,
        amount
      );

      let path = [targetNetwork.foundryTokenAddress, tokenAddress];
      const amounts = await targetNetwork.dexContract.getAmountsOut(
        amount,
        path
      );
      const amountsOut = amounts[1];
      if (isTokenFoundryAsset == false && Number(amountsOut) > 0) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }


  async swapOnSameNetwork(sourceChainId, sourceTokenAddress, targetTokenAddress, inputAmout){
    const sourceNetwork = networks[sourceChainId];
    const path = [sourceTokenAddress, targetTokenAddress];

    const sourceSigner = signer.connect(sourceNetwork.provider);

    const amounts = await sourceNetwork.dexContract.getAmountsOut(
      inputAmout,
      path
    );
    const amountOutMin = amounts[1];
    
    if(sourceTokenAddress == sourceNetwork.weth){
      const res = await sourceNetwork.fiberRouterContract.connect(sourceSigner).swapETHForTokenSameNetwork(
        sourceSigner.address,
        sourceNetwork.router,
        inputAmout,
        amountOutMin,
        path,
        this.getDeadLine().toString(), // deadline
        {value: inputAmout, gasLimit: 1000000}
      )
      const receipt = res.wait();
      if(receipt.status == 1){
        console.log("Successfully swap ETH to token on the same network")
      }
    }else if(targetTokenAddress == sourceNetwork.weth){
      const sourceTokenContract = new ethers.Contract(sourceTokenAddress, tokenAbi.abi, sourceNetwork.provider);
      await sourceTokenContract.connect(sourceSigner).approve(sourceNetwork.fiberRouter, inputAmout);
      const res = await sourceNetwork.fiberRouterContract.connect(sourceSigner).swapTokenForETHSameNetwork(
        sourceSigner.address,
        sourceNetwork.router,
        inputAmout,
        amountOutMin,
        path,
        this.getDeadLine().toString(), // deadline
        {gasLimit: 1000000}
      )
      const receipt = await res.wait();
      if(receipt.status == 1){
        console.log("Successfully swap token to ETH on the same network")
      }
    } else {
      const sourceTokenContract = new ethers.Contract(sourceTokenAddress, tokenAbi.abi, sourceNetwork.provider);
      await sourceTokenContract.connect(sourceSigner).approve(sourceNetwork.fiberRouter, inputAmout);
      const res = await sourceNetwork.fiberRouterContract.connect(sourceSigner).swapTokenForTokenSameNetwork(
        sourceSigner.address,
        sourceNetwork.router,
        inputAmout,
        amountOutMin,
        path,
        this.getDeadLine().toString(), // deadline
        {gasLimit: 1000000}
      )
      const receipt = await res.wait();
      if(receipt.status == 1){
        console.log("Successfully swap token to token on the same network")
      }
    }
  }

  getDeadLine() {
    const currentDate = new Date();
    const deadLine = currentDate.getTime() + 20 * 60000;
    return deadLine;
  }

  //main function to bridge and swap tokens
  async SWAP(
    sourceTokenAddress,
    targetTokenAddress,
    sourceChainId,
    targetChainId,
    inputAmount
  ) {
    //error if source and network token and chain id are similar
    if(sourceTokenAddress == targetTokenAddress && sourceChainId == targetChainId){
      console.error("ERROR: SAME TOKEN ADDRESS AND CHAIN ID");
      return;
    }
    // mapping source and target networks (go to Network.js file)
    const sourceNetwork = networks[sourceChainId];
    const targetNetwork = networks[targetChainId];
    //signers for both side networks
    const sourceSigner = signer.connect(sourceNetwork.provider);
    const targetSigner = signer.connect(targetNetwork.provider);
    // source token contract (required to approve function)
    const sourceTokenContract = new ethers.Contract(
      sourceTokenAddress,
      tokenAbi.abi,
      sourceNetwork.provider
    );

    const sourceTokenDecimal = await sourceTokenContract.decimals();
    const amount = (inputAmount * 10 ** Number(sourceTokenDecimal)).toString();
    console.log("input amount", amount);
    
    //only swap on one network if source and target chain id are equal
    if(sourceChainId == targetChainId){
      console.log("Swap on the same network ...");
      await this.swapOnSameNetwork(sourceChainId, sourceTokenAddress, targetTokenAddress, amount);
      return;
    }
    // is source token foundy asset
    const isFoundryAsset = await this.sourceFACCheck(
      sourceNetwork,
      sourceTokenAddress,
      amount
    );
    //is source token refinery asset
    const isRefineryAsset = await this.isSourceRefineryAsset(
      sourceNetwork,
      sourceTokenAddress,
      amount
    );

    let receipt;
    let sourceBridgeAmount;
    if (isFoundryAsset) {
      console.log("Source token is foundry asset");
      console.log("add foundry asset in source network");
      // approve to fiber router to transfer tokens to the fund manager contract
      const targetFoundryAddress = await sourceNetwork.fundManagerContract.allowedTargets(sourceTokenAddress, targetChainId);
      await sourceTokenContract
        .connect(sourceSigner)
        .approve(sourceNetwork.fiberRouterContract.address, amount);
      // fiber router add foundry asset to fund manager
      const result = await sourceNetwork.fiberRouterContract
        .connect(sourceSigner)
        .swap(
          sourceTokenAddress,
          amount,
          targetChainId,
          targetFoundryAddress,
          targetSigner.address,
          { gasLimit: 1000000 }
        );
      //wait until the transaction be completed
      sourceBridgeAmount = amount;
      receipt = await result.wait();
    } else if (isRefineryAsset) {
      console.log(" Source token is refinery asset");
      console.log("swap refinery token to foudry token ...");
      //swap refinery token to the foundry token
      let path = [sourceTokenAddress, sourceNetwork.foundryTokenAddress];

      const amounts = await sourceNetwork.dexContract.getAmountsOut(
        amount,
        path
      );
      const amountsOut = amounts[1];
      sourceBridgeAmount = amountsOut;
      await sourceTokenContract
        .connect(sourceSigner)
        .approve(sourceNetwork.fiberRouterContract.address, amount);
      const result = await sourceNetwork.fiberRouterContract
        .connect(sourceSigner)
        .swapAndCross(
          sourceNetwork.dexContract.address,
          amount,
          amountsOut,
          path,
          this.getDeadLine().toString(), // deadline
          targetChainId,
          targetNetwork.foundryTokenAddress,
          {
            gasLimit: 1000000,
          }
        );
      //wait until the transaction be completed
      receipt = await result.wait();
    } else {
      console.log("Token is ionic asset");
      console.log("swap ionic token to foudry token ...");
      //swap refinery token to the foundry token
      let path = [
        sourceTokenAddress,
        sourceNetwork.weth,
        sourceNetwork.foundryTokenAddress,
      ];

      const amounts = await sourceNetwork.dexContract.getAmountsOut(
        amount,
        path
      );
      const amountsOut = amounts[amounts.length - 1];
      sourceBridgeAmount = amountsOut;
      await sourceTokenContract
        .connect(sourceSigner)
        .approve(sourceNetwork.fiberRouterContract.address, amount);
      const result = await sourceNetwork.fiberRouterContract
        .connect(sourceSigner)
        .swapAndCross(
          sourceNetwork.dexContract.address,
          amount,
          amountsOut,
          path,
          this.getDeadLine().toString(), // deadline
          targetChainId,
          targetNetwork.foundryTokenAddress,
          {
            gasLimit: 1000000,
          }
        );
      //wait until the transaction be completed
      receipt = await result.wait();
    }
    if (receipt.status == 1) {
      console.log("successfully swap in source network !");
      const isTargetTokenFoundry = await this.targetFACCheck(
        targetNetwork,
        targetTokenAddress,
        sourceBridgeAmount
      );
      if (isTargetTokenFoundry === true) {
        console.log("Target token is foundry asset");
        console.log("withdraw foundry asset ...");
        //if target token is foundry asset
        const result = await targetNetwork.fiberRouterContract
          .connect(targetSigner)
          .withdraw(
            targetTokenAddress, //token address on network 2
            targetSigner.address, //reciver
            sourceBridgeAmount, //targetToken amount
            { gasLimit: 1000000 }
          );

        const receipt = await result.wait();
        if (receipt.status == 1) {
          console.log("success withdraw foundry token on source network !");
        }
      } else {
        const isTargetRefineryToken = await this.isTargetRefineryAsset(
          targetNetwork,
          targetTokenAddress,
          sourceBridgeAmount
        );
        if (isTargetRefineryToken == true) {
          console.log("target token is refinery asset");

          console.log("withdraw and swap foundry token to target token ....");
          let path2 = [targetNetwork.foundryTokenAddress, targetTokenAddress];
          const amounts2 = await targetNetwork.dexContract.getAmountsOut(
            sourceBridgeAmount,
            path2
          );
          const amountsOut2 = amounts2[1];
          const result3 = await targetNetwork.fiberRouterContract
            .connect(targetSigner)
            .withdrawAndSwap(
              targetSigner.address,
              targetNetwork.router,
              sourceBridgeAmount,
              amountsOut2,
              path2,
              this.getDeadLine().toString(),
              {
                gasLimit: 1000000,
              }
            );
          const receipt3 = await result3.wait();
          if (receipt3.status == 1) {
            console.log("successfully swap foundry token to target token");
            console.log("Cheers! your bridge and swap was successful !!!");
          }
        } else {
          console.log("target token is ionic asset");

          console.log("withdraw and swap foundry token to target token ....");
          let path2 = [
            targetNetwork.foundryTokenAddress,
            targetNetwork.weth,
            targetTokenAddress,
          ];
          const amounts2 = await targetNetwork.dexContract.getAmountsOut(
            sourceBridgeAmount,
            path2
          );
          const amountsOut2 = amounts2[amounts2.length - 1];
          const result3 = await targetNetwork.fiberRouterContract
            .connect(targetSigner)
            .withdrawAndSwap(
              targetSigner.address,
              targetNetwork.router,
              sourceBridgeAmount,
              amountsOut2,
              path2,
              this.getDeadLine().toString(), //deadline
              {
                gasLimit: 1000000,
              }
            );
          const receipt3 = await result3.wait();
          if (receipt3.status == 1) {
            console.log("successfully swap foundry token to target token");
            console.log("Cheers! your bridge and swap was successful !!!");
          }
        }
      }
    }
  }
}

module.exports = Fiber;

const fiber = new Fiber();

fiber.SWAP(
  goerliUsdc, 
  bscCake, 
  5, // source chain id 
  97, // target chain id
  10 //source token amount
);

//console.log(fiber.getDeadLine().toString())
// fiber.sourceFACCheck(networks[97], bscUsdt, "10000000000000000000").then(console.log)

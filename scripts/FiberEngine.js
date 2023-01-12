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
} = require("../Network");
const toWei = (i) => ethers.utils.parseEther(i);
const toEther = (i) => ethers.utils.formatEther(i);

// user wallet
const signer = new ethers.Wallet(process.env.PRIVATE_KEY0);

class Fiber {
  constructor() {}
  //check the requested token exist on the Source network Fund Manager
  async sourceFACCheck(sourceNetwork, tokenAddress) {
    const isSourceTokenFoundryAsset =
      await sourceNetwork.fundManagerContract.isFoundryAsset(tokenAddress);
    return isSourceTokenFoundryAsset;
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
        tokenAddress
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

  //check source token is foundry asset
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
    
    // For swapping on ETHEREUM Blockchain IF ElseIf both conditions are performed
    // IF SourceToken(Eth) <> TargetToken on Same Network 
    // ELESE IF (SourceToken <> TargetToken (Eth) on Same Network
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
    } // For Swapping Different Tokens on Same Network
    else {
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
        console.log(
              "SUCCESS: Successfully Swapped sourceToken to TargetToken on same Network"
            );
        console.log("Cheers! your bridge and swap was successful !!!");
        console.log("Transaction hash is: ", res.hash);
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
    console.log("INIT: Swap Initiated for this Amount: ", inputAmount);
    if(sourceChainId == targetChainId){
      console.log("ALERT: Swap Initiated on the Same Network");
      await this.swapOnSameNetwork(sourceChainId, sourceTokenAddress, targetTokenAddress, amount);
      return;
    }    
    // is source token foundy asset
    const isFoundryAsset = await this.sourceFACCheck(
      sourceNetwork,
      sourceTokenAddress
    );
    //is source token refinery asset
    const isRefineryAsset = await this.isSourceRefineryAsset(
      sourceNetwork,
      sourceTokenAddress,
      amount
    );

    let receipt;
    let sourceBridgeAmount;
    let swapResult;
    if (isFoundryAsset) {
      console.log("SN-1: Source Token is Foundry Asset");
      console.log("SN-2: Add Foundry Asset in Source Network FundManager");
      // approve to fiber router to transfer tokens to the fund manager contract
      const targetFoundryTokenAddress = await sourceNetwork.fundManagerContract.allowedTargets(sourceTokenAddress, targetChainId);
      await sourceTokenContract
        .connect(sourceSigner)
        .approve(sourceNetwork.fiberRouterContract.address, amount);
      // fiber router add foundry asset to fund manager
      swapResult = await sourceNetwork.fiberRouterContract
        .connect(sourceSigner)
        .swap(
          sourceTokenAddress,
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
      swapResult = await sourceNetwork.fiberRouterContract
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
      receipt = await swapResult.wait();
    } else {
      console.log("SN-1: Source Token is Ionic Asset");
      console.log("SN-2: Swap Ionic Asset to Foundry Asset ...");
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
      swapResult = await sourceNetwork.fiberRouterContract
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
      receipt = await swapResult.wait();
    }
    if (receipt.status == 1) {
      console.log(
        "SUCCESS: Assets are successfully Swapped in Source Network !"
      );
      console.log("Cheers! your bridge and swap was successful !!!");
      console.log("Transaction hash is: ", swapResult.hash);
      const isTargetTokenFoundry = await this.targetFACCheck(
        targetNetwork,
        targetTokenAddress,
        sourceBridgeAmount
      );
      if (isTargetTokenFoundry === true) {
        console.log("TN-1: Target Token is Foundry Asset");
        console.log("TN-2: Withdraw Foundry Asset...");
        //if target token is foundry asset
        const swapResult = await targetNetwork.fiberRouterContract
          .connect(targetSigner)
          .withdraw(
            targetTokenAddress, //token address on network 2
            targetSigner.address, //reciver
            sourceBridgeAmount, //targetToken amount
            { gasLimit: 1000000 }
          );

        const receipt = await swapResult.wait();
        if (receipt.status == 1) {
          console.log(
            "SUCCESS: Foundry Assets are Successfully Withdrawn on Source Network !"
          );
          console.log("Cheers! your bridge and swap was successful !!!");
          console.log("Transaction hash is: ", swapResult.hash);
        }
      } else {
        const isTargetRefineryToken = await this.isTargetRefineryAsset(
          targetNetwork,
          targetTokenAddress,
          sourceBridgeAmount
        );
        if (isTargetRefineryToken == true) {
          console.log("TN-1: Target token is Refinery Asset");

          console.log(
            "TN-2: Withdraw and Swap Foundry Asset to Target Token ...."
          );
          let path2 = [targetNetwork.foundryTokenAddress, targetTokenAddress];
          const amounts2 = await targetNetwork.dexContract.getAmountsOut(
            sourceBridgeAmount,
            path2
          );
          const amountsOut2 = amounts2[1];
          const swapResult2 = await targetNetwork.fiberRouterContract
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
          let path2 = [
            targetNetwork.foundryTokenAddress,
            targetNetwork.wbnb,
            targetTokenAddress,
          ];
          const amounts2 = await targetNetwork.dexContract.getAmountsOut(
            sourceBridgeAmount,
            path2
          );
          const amountsOut2 = amounts2[amounts2.length - 1];
          const swapResult3 = await targetNetwork.fiberRouterContract
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
          const receipt3 = await swapResult3.wait();
          if (receipt3.status == 1) {
            console.log(
              "TN-3: Successfully Swapped Foundry Token to Target Token"
            );
            console.log("Cheers! your bridge and swap was successful !!!");
            console.log("Transaction hash is: ", swapResult3.hash);
          }
        }
      }
    }
  }
}
module.exports = Fiber;
const fiber = new Fiber();

fiber.SWAP(
  goerliAda, // goerli ada
  goerliAave, // bsc ada
  5, // source chain id (goerli)
  5, // target chain id (bsc)
  10 //source token amount
);



//console.log(fiber.getDeadLine().toString())
// fiber.sourceFACCheck(networks[97], bscUsdt, "10000000000000000000").then(console.log)

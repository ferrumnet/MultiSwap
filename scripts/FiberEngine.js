const { ethers } = require("ethers");
const axios = require("axios");
require("dotenv").config();
const fundManagerAbi = require("../artifacts/contracts/upgradeable-Bridge/FundManager.sol/FundManager.json");
const fiberRouterAbi = require("../artifacts/contracts/upgradeable-Bridge/FiberRouter.sol/FiberRouter.json");
const tokenAbi = require("../artifacts/contracts/token/Token.sol/Token.json");
const routerAbi = require("../artifacts/contracts/common/uniswap/IUniswapV2Router02.sol/IUniswapV2Router02.json");
const { produecSignaturewithdrawHash, fixSig } = require("./utils/BridgeUtils");
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
  bscWeth
} = require("../Network");
const Web3 = require('web3');
const { estimateGas } = require("./utils");
const { ecsign, toRpcSig } = require("ethereumjs-util");
const toWei = (i) => ethers.utils.parseEther(i);
const toEther = (i) => ethers.utils.formatEther(i);
const MAX_FEE_PER_GAS = '60';
const MAX_PRIORITY_FEE_PER_GAS = '60';
const GAS_LIMIT = '2000000';
const Salt = "0x317eebdf37fe5de8c6e7acd5f9e5680349fa25ea50c32d7d87109b14d2646f26";



// user wallet
const signer = new ethers.Wallet(process.env.PRIVATE_KEY0);
async function estimateGasForWithdraw(sourceChainId, from) {
  let data = {};
  if (sourceChainId == 137) {
    let maxFeePerGas = MAX_FEE_PER_GAS;
    let maxPriorityFeePerGas = MAX_PRIORITY_FEE_PER_GAS;
    let gasLimit = GAS_LIMIT;

    let item = 1
    if (item) {
      maxFeePerGas = MAX_FEE_PER_GAS;
      maxPriorityFeePerGas = MAX_PRIORITY_FEE_PER_GAS;
      gasLimit = GAS_LIMIT;
    }

    data.maxFeePerGas = Web3.utils.toHex(Web3.utils.toWei(maxFeePerGas, 'gwei'));
    data.maxPriorityFeePerGas = Web3.utils.toHex(Web3.utils.toWei(maxPriorityFeePerGas, 'gwei'));
    data.gasLimit = gasLimit;

  } else {
    data.gasPrice = 15000000000
  }
  return data;
}

async function estimateGasForSwap(sourceChainId, from) {
  let data = {};
  if (sourceChainId == 137) {
    let maxFeePerGas = MAX_FEE_PER_GAS;
    let maxPriorityFeePerGas = MAX_PRIORITY_FEE_PER_GAS;
    let gasLimit = GAS_LIMIT;

    let item = await db.GasFees.findOne({ type: 'polygon' });
    if (item) {
      maxFeePerGas = item.maxFeePerGas;
      maxPriorityFeePerGas = item.maxPriorityFeePerGas;
      gasLimit = item.gasLimit;
    }

    data.maxFeePerGas = Web3.utils.toHex(Web3.utils.toWei(maxFeePerGas, 'gwei'));
    data.maxPriorityFeePerGas = Web3.utils.toHex(Web3.utils.toWei(maxPriorityFeePerGas, 'gwei'));
    data.gas = { gasLimit: gasLimit };
  } else {
    data.gas = {};
  }
  return data;
}

class Fiber {
  constructor() { }

  
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


  //check the requested token exist on the Source network Fund Manager
  async isTargetOtherFoundry(sourceNetwork, targetNetwork, sourceBridgetokenAddress, targetTokenAddress) {
    const targetBridgeTokenAddress = await sourceNetwork.fundManagerContract.allowedTargets(sourceBridgetokenAddress, targetNetwork.chainId.toString());
    if (targetBridgeTokenAddress === targetTokenAddress) {
      return false;
    } else {
      return true;
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


  async swapOnSameNetwork(sourceChainId, sourceTokenAddress, targetTokenAddress, inputAmout) {
    const sourceNetwork = networks[sourceChainId];
    const path = [sourceTokenAddress, targetTokenAddress];

    const sourceSigner = signer.connect(sourceNetwork.provider);
    let amounts;
    try {
      amounts = await sourceNetwork.dexContract.getAmountsOut(
        inputAmout,
        path
      );
    } catch (error) {
      throw "ALERT: DEX doesn't have liquidity for this pair";
    }
    const amountOutMin = amounts[1];

    // For swapping on ETHEREUM Blockchain IF ElseIf both conditions are performed
    // IF SourceToken(Eth) <> TargetToken on Same Network 
    // ELESE IF (SourceToken <> TargetToken (Eth) on Same Network
    if (sourceTokenAddress == sourceNetwork.weth) {
      const res = await sourceNetwork.fiberRouterContract.connect(sourceSigner).swapETHForTokenSameNetwork(
        sourceSigner.address,
        sourceNetwork.router,
        inputAmout,
        amountOutMin,
        path,
        this.getDeadLine().toString(), // deadline
        { value: inputAmout, gasLimit: 1000000000 }
      )
      const receipt = res.wait();
      if (receipt.status == 1) {
        console.log("Successfully swap ETH to token on the same network")
      }
    } else if (targetTokenAddress == sourceNetwork.weth) {
      const sourceTokenContract = new ethers.Contract(sourceTokenAddress, tokenAbi.abi, sourceNetwork.provider);
      await sourceTokenContract.connect(sourceSigner).approve(sourceNetwork.fiberRouter, inputAmout);
      const res = await sourceNetwork.fiberRouterContract.connect(sourceSigner).swapTokenForETHSameNetwork(
        sourceSigner.address,
        sourceNetwork.router,
        inputAmout,
        amountOutMin,
        path,
        this.getDeadLine().toString(), // deadline
        { gasLimit: 1000000000 }
      )
      const receipt = await res.wait();
      if (receipt.status == 1) {
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
        { gasLimit: 1000000000 }
      )
      const receipt = await res.wait();
      if (receipt.status == 1) {
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
    if (sourceTokenAddress == targetTokenAddress && sourceChainId == targetChainId) {
      console.error("ERROR: SAME TOKEN ADDRESS AND CHAIN ID");
      return;
    }
    // mapping source and target networks (go to Network.js file)
    const sourceNetwork = networks[sourceChainId];
    const targetNetwork = networks[targetChainId];
    //signers for both side networks
    const sourceSigner = signer.connect(sourceNetwork.provider);
    const targetSigner = signer.connect(targetNetwork.provider);
    const gasForWithdraw = await estimateGasForWithdraw(targetChainId, "0x0Bdb79846e8331A19A65430363f240Ec8aCC2A52");
    const gasForSwap = await estimateGasForWithdraw(sourceChainId, "0x0Bdb79846e8331A19A65430363f240Ec8aCC2A52");
    // source token contract (required to approve function)
    const sourceTokenContract = new ethers.Contract(
      sourceTokenAddress,
      tokenAbi.abi,
      sourceNetwork.provider
    );
    // target token contract
    const targetTokenContract = new ethers.Contract(
      targetTokenAddress,
      tokenAbi.abi,
      targetNetwork.provider
    );

    const sourceTokenDecimal = await sourceTokenContract.decimals();
    const targetTokenDecimal = await targetTokenContract.decimals();
    const amount = (inputAmount * 10 ** Number(sourceTokenDecimal)).toString();
    console.log("INIT: Swap Initiated for this Amount: ", inputAmount);
    if (sourceChainId == targetChainId) {
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
    let sourceBridgeToken;
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
          gasForSwap
        );
      //wait until the transaction be completed
      sourceBridgeAmount = sourceBridgeAmount = (inputAmount * 10 ** Number(targetTokenDecimal)).toString();;
      sourceBridgeToken = sourceTokenAddress;
      receipt = await swapResult.wait();
    } else if (isRefineryAsset) {
      console.log("SN-1: Source Token is Refinery Asset");
      console.log("SN-2: Swap Refinery Asset to Foundry Asset ...");
      //swap refinery token to the foundry token
      const amount = await (inputAmount * 10 ** Number(targetTokenDecimal)).toString();
      let path = [sourceTokenAddress, sourceNetwork.foundryTokenAddress];
      let amounts;
      try {
        amounts = await sourceNetwork.dexContract.getAmountsOut(
          amount,
          path
        );
      } catch (error) {
        throw "ALERT: DEX doesn't have liquidity for this pair"
      }
      const amountsOut = amounts[1];
      sourceBridgeAmount = amountsOut;
      sourceBridgeToken = path[path.length - 1];
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
          gasForSwap
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
      let amounts;
      try {
        amounts = await sourceNetwork.dexContract.getAmountsOut(
          amount,
          path
        );
      } catch (error) {
        throw "ALERT: DEX doesn't have liquidity for this pair"
      }
      const amountsOut = amounts[amounts.length - 1];
      sourceBridgeAmount = amountsOut;
      sourceBridgeToken = path[path.length - 1];
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
          gasForSwap
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
      console.log("failine1")
      let amountIn = (inputAmount * 10 ** Number(targetTokenDecimal)).toString();
      console.log("failine2")

      const isTargetTokenFoundry = await this.targetFACCheck(
        targetNetwork,
        targetTokenAddress,
        Math.floor(amountIn)
      );

      const istargetOtherFoundry = await this.isTargetOtherFoundry(
        sourceNetwork,
        targetNetwork,
        sourceTokenAddress,
        targetTokenAddress
      );
      console.log("failine3", istargetOtherFoundry)

      if (isTargetTokenFoundry === true) {
        console.log("failine4")

        // if (istargetOtherFoundry === false) {
          console.log("failine5")

          console.log("TN-1: Target Token is Foundry Asset");
          console.log("TN-2: Withdraw Foundry Asset...");
          const hash = await produecSignaturewithdrawHash(
            targetNetwork.chainId,
            targetNetwork.fundManager,
            targetTokenAddress,
            targetSigner.address,
            sourceBridgeAmount,
            Salt
          );
          const sigP2 = ecsign(
            Buffer.from(hash.replace("0x", ""), "hex"),
            Buffer.from(process.env.PRIVATE_KEY0.replace("0x", ""), "hex")
          );
          const sig2 = fixSig(toRpcSig(sigP2.v, sigP2.r, sigP2.s));
          //if target token is foundry asset
          const swapResult = await targetNetwork.fiberRouterContract
            .connect(targetSigner)
            .withdrawSigned(
              targetTokenAddress, //token address on network 2
              targetSigner.address, //reciver
              sourceBridgeAmount, //targetToken amount
              Salt,
              sig2,
              gasForWithdraw
            );

          const receipt = await swapResult.wait();
          if (receipt.status == 1) {
            console.log(
              "SUCCESS: Foundry Assets are Successfully Withdrawn on Source Network !"
            );
            console.log("Cheers! your bridge and swap was successful !!!");
            console.log("Transaction hash is: ", swapResult.hash);
          }
        // } else if (istargetOtherFoundry === true) {
        //   console.log("Target token is other foundry asset");
        //   console.log("withdraw foundry asset ...");
        //   const sig2 = fixSig(toRpcSig(sigP2.v, sigP2.r, sigP2.s));
        //   const targetBridgeToken = await sourceNetwork.fundManagerContract.allowedTargets(sourceBridgeToken, targetChainId.toString());
        //   const swapResult = await targetNetwork.fiberRouterContract
        //     .connect(targetSigner)
        //     .withdrawAndSwapToFoundry(
        //       targetBridgeToken, //bridge foundry token address
        //       targetTokenAddress, //target token address (target foundry)
        //       targetSigner.address, //reciver
        //       sourceBridgeAmount, //targetToken amount
        //       gasForWithdraw
        //     );

        //   const receipt = await swapResult.wait();
        //   if (receipt.status == 1) {
        //     console.log(
        //       "SUCCESS: Foundry Assets are Successfully Withdrawn on Source Network !"
        //     );
        //     console.log("Cheers! your bridge and swap was successful !!!");
        //     console.log("Transaction hash is: ", swapResult.hash);
        //   }
        // }
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
          let amounts2;
          try {
            amounts2 = await targetNetwork.dexContract.getAmountsOut(
              sourceBridgeAmount,
              path2
            );
          } catch (error) {
            throw "ALERT: DEX doesn't have liquidity for this pair"
          }
          const hash = await produecSignaturewithdrawHash(
            targetNetwork.chainId,
            targetNetwork.fundManager,
            path2[0],
            targetNetwork.fiberRouter,
            sourceBridgeAmount,
            Salt
          );
          const sigP2 = ecsign(
            Buffer.from(hash.replace("0x", ""), "hex"),
            Buffer.from(process.env.PRIVATE_KEY0.replace("0x", ""), "hex")
          );
          const sig2 = fixSig(toRpcSig(sigP2.v, sigP2.r, sigP2.s));
          console.log("Sig produced2=====================>2", sig2, sigP2, targetSigner.address);
          const amountsOut2 = amounts2[1];
          const swapResult2 = await targetNetwork.fiberRouterContract
            .connect(targetSigner)
            .withdrawSignedAndSwap(
              targetSigner.address,
              targetNetwork.router,
              sourceBridgeAmount,
              amountsOut2,
              path2,
              this.getDeadLine().toString(),
              Salt,
              sig2,
              gasForWithdraw
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
            targetNetwork.weth,
            targetTokenAddress,
          ];
          let amounts2;
          try {
            amounts2 = await targetNetwork.dexContract.getAmountsOut(
              sourceBridgeAmount,
              path2
            );
          } catch (error) {
            throw "ALERT: DEX doesn't have liquidity for this pair"
          }
          const hash = await produecSignaturewithdrawHash(
            targetNetwork.chainId,
            targetNetwork.fundManager,
            path2[0],
            targetNetwork.fiberRouter,
            sourceBridgeAmount,
            Salt
          );
          const sigP2 = ecsign(
            Buffer.from(hash.replace("0x", ""), "hex"),
            Buffer.from(process.env.PRIVATE_KEY0.replace("0x", ""), "hex")
          );
          const sig2 = fixSig(toRpcSig(sigP2.v, sigP2.r, sigP2.s));
          console.log("Sig produced2=====================>2", sig2, sigP2, targetSigner.address);
          const amountsOut2 = amounts2[amounts2.length - 1];
          const swapResult3 = await targetNetwork.fiberRouterContract
            .connect(targetSigner)
            .withdrawSignedAndSwap(
              targetSigner.address,
              targetNetwork.router,
              sourceBridgeAmount,
              amountsOut2,
              path2,
              this.getDeadLine().toString(), //deadline
              Salt,
              sig2,
              gasForWithdraw
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
  '0x40E51e0eC04283e300F12f6bB98DA157Bb22036E',
  '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
  56, // source chain id (goerli)
  137, // target chain id (bsc)
  0.0001 //source token amount
);



//console.log(fiber.getDeadLine().toString())
// fiber.sourceFACCheck(networks[97], bscUsdt, "10000000000000000000").then(console.log)

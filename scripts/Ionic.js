const { ethers } = require("ethers");
const axios = require("axios");
require("dotenv").config();
const fundManagerAbi = require("../artifacts/contracts/upgradeable-Bridge/FundManager.sol/FundManager.json");
const fiberRouterAbi = require("../artifacts/contracts/upgradeable-Bridge/FiberRouter.sol/FiberRouter.json");
const tokenAbi = require("../artifacts/contracts/token/Token.sol/Token.json");
const routerAbi = require('../artifacts/contracts/common/uniswap/IUniswapV2Router02.sol/IUniswapV2Router02.json');
const toWei = (i) => ethers.utils.parseEther(i);
const toEther = (i) => ethers.utils.formatEther(i);

const bscCake = "0xFa60D973F7642B748046464e165A65B7323b0DEE";
const goerliUsdc = "0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C";
//goerli rpc
const sourceNetwork = "https://goerli.infura.io/v3/fa18fa35171744ae8ac35d12baa36ae3";
//bsc rpc
const targetNetwork = "https://apis.ankr.com/f9946df03b9741df9e20e6d376021c81/17d51fb5735bba322c78e521ac58c161/binance/full/test";

//networks chain id
const sourceNetworkId = 5; //goerli
const targetNetworkId = 97; //bsc

//network providers
const sourceProvider = new ethers.providers.JsonRpcProvider(sourceNetwork);
const targetProvider = new ethers.providers.JsonRpcProvider(targetNetwork);

// user wallet
const signer = new ethers.Wallet(process.env.PRI_KEY);
const sourceSigner = signer.connect(sourceProvider);
const targetSigner = signer.connect(targetProvider);

// usdt token on goerli and bsc networks as foundry asset
const sourceFoundryTokenAddress = "0x636b346942ee09Ee6383C22290e89742b55797c5"; //goerli usdt
const targetFoundryTokenAddress = "0xD069d62C372504d7fc5f3194E3fB989EF943d084"; //bsc usdt

//source foundry token contract
const sourceFoundryTokenContract = new ethers.Contract(
  sourceFoundryTokenAddress,
  tokenAbi.abi,
  sourceProvider
);

//target foundry token contract
const targetFoundryTokenContract = new ethers.Contract(
  targetFoundryTokenAddress,
  tokenAbi.abi,
  targetProvider
);

//goerli and bsc dex address
let sourceRouterAddress = "0xEfF92A263d31888d860bD50809A8D171709b7b1c"; //goerli router dex
let targetRouterAddress = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"; //bsc router dex

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
const sourcefundMangerAddress = "0x9B887791463cc3BfEBB04D8f54603E5E9ed81f1C";
// bsc fundManager contract
const targetFundManagerAddress = "0xE450A528532FaeF1Feb1094eA2674e7A1fAA3E78";

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

// goerli fundManager contract
const sourceFiberRouterAddress = "0xa20Ea6722D828C9A5d370E6cdB9608d9e0459F26";
// bsc fundManager contract
const targetFiberRouterAddress = "0x6147F4c2b20d3638d12600C6F2189e7A890F3Bbf";

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

//check the requested token exist on the Source network Fund Manager
async function sourceFACCheck(tokenAddress) {
  const isSourceTokenFoundryAsset = await sourceFundMangerContract.isFoundryAsset(tokenAddress);
  return isSourceTokenFoundryAsset;
}

//check the requested token exist on the Source network Fund Manager
async function targetFACCheck(tokenAddress, amount) {
  const isTargetTokenFoundryAsset = await targetFundMangerContract.isFoundryAsset(tokenAddress);

  const targetFoundryTokenContract = new ethers.Contract(
    tokenAddress,
    tokenAbi.abi,
    targetProvider
  );

  // Liquidity Check for targetFoundryTokken in TargetFundManager
  const targetFoundryAssetLiquidity = await targetFoundryTokenContract.balanceOf(
    targetFundMangerContract.address
  );

  if (isTargetTokenFoundryAsset == true && Number(targetFoundryAssetLiquidity) > Number(amount)) {
      return true;
  }
  else{
    return false;
  }
}


//check source toke is foundry asset
async function isSourceRefineryAsset(tokenAddress, amount) {
  try {
    const isTokenFoundryAsset = await sourceFACCheck(tokenAddress);

      let path = [tokenAddress, sourceFoundryTokenAddress];
      const amounts = await sourceDexContract.getAmountsOut(amount, path);
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
async function isTargetRefineryAsset(tokenAddress, amount) {
  try {
    const isTokenFoundryAsset = await targetFACCheck(tokenAddress, amount);

    let path = [targetFoundryTokenAddress, tokenAddress];
    const amounts = await sourceDexContract.getAmountsOut(amount, path);
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

//swap foundry asset on two networks
async function IONICCheck(sourcetokenAddress, targetTokenAddress, amount) {
  const isRefineryAsset = isSourceRefineryAsset(sourcetokenAddress, amount);
  if (isRefineryAsset == true) return;
  console.log("SN-1: Source Token is Ionic Asset");
  const sourceTokenContract = new ethers.Contract(
    sourcetokenAddress,
    tokenAbi.abi,
    sourceProvider
  );
  console.log("SN-2: Swap Ionic Token to Foundry Token ...");
  //swap ionic token to the foundry token

  // SwapRoute1 : [goerliADA -> USDC]   SwapRoute2 : [USDC -> USDT]
  let path = [sourcetokenAddress, goerliUsdc, sourceFoundryTokenAddress];


  const amounts = await sourceDexContract.getAmountsOut(amount, path);

  // Since there are more than two tokens so (amounts.length - 1) 
  // represents the amountOut of optimal price
  const amountsOut = amounts[amounts.length - 1];  

  // User Approves FiberRouter to use the x Amount of tokens
  await sourceTokenContract
    .connect(sourceSigner)
    .approve(sourceFiberRouterContract.address, amount);

  // FiberEngine calls FiberRouter's SwapAndCross function 
  // TO Perform swapRoute1 & swapRoute2 to get USDC on DEXRouter
  const result = await sourceFiberRouterContract
    .connect(sourceSigner)
    .swapAndCross(
      sourceDexContract.address, // DEX Router
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
  const receipt = await result.wait();
  if (receipt.status == 1) {
    console.log("SN-3: Successfully swapped from SourceToken to FoundryToken on SourceNetwork!");
    console.log("Transaction hash is: ", result.hash);
    const isTargetTokenFoundry = await targetFACCheck(
      targetTokenAddress,
      amountsOut
    );
    if (isTargetTokenFoundry === true) {
      console.log("TN-1: Target Token is Foundry Asset");
      console.log("TN-2: Withdraw Foundry Asset...");

      // IF target token is Foundry Asset
      // FiberEngine will call FiberRouter Withdraw 
      // Function to withdraw FoundryTokens
      const result = await targetFiberRouterContract
        .connect(targetSigner)
        .withdraw(
          targetFoundryTokenAddress, //token address on network 2
          signer.address, //reciever
          amountsOut, //targetToken amount
          { gasLimit: 1000000 }
        );

      const receipt = result.wait();
      if (receipt.status == 1) {
        console.log("TN-3 SUCCESS: Withdrawn Foundry Token on Target Network !");
        console.log("Transaction hash is: ", result.hash);
      }
    } else {
      const isTargetRefineryToken = await isTargetRefineryAsset(
        targetTokenAddress,
        amountsOut
      );
      if (isTargetRefineryToken == true) {
        console.log("TN-1: Target Token is Refinery Asset");

        console.log("TN-2: Withdraw and Swap Foundry Token to Target Token ....");
        let path2 = [targetFoundryTokenAddress, targetTokenAddress];
        const amounts2 = await targetDexContract.getAmountsOut(
          amountsOut,
          path2
        );
        const amountsOut2 = amounts2[1];
        const result2 = await targetFiberRouterContract
          .connect(targetSigner)
          .withdrawAndSwap(
            signer.address,
            targetRouterAddress,
            amountsOut,
            amountsOut2,
            path2,
            "1669318064",
            {
              gasLimit: 1000000,
            }
          );
        const receipt2 = await result2.wait();
        if (receipt2.status == 1) {
          console.log("TN-3: Successfully Swapped Foundry Token to Target Token");
          console.log("Cheers! your bridge and swap was successful !!!");
          console.log("Transaction hash is: ", result2.hash);
        }
      } else {
        console.log("TN-1: Target Token is Ionic Asset");

        console.log("TN-2: Withdraw and Swap Foundry Token to Target Token ....");

        // SwapRoute1 : [USDT -> CAKE]   SwapRoute2 : [CAKE -> bscADA]
        let path2 = [targetFoundryTokenAddress, bscCake, targetTokenAddress];

        const amounts2 = await targetDexContract.getAmountsOut(
          amountsOut,
          path2
        );

        const amountsOut2 = amounts2[amounts2.length - 1];

        // FiberEngine calls FiberRouter's withdrawAndSwap function 
        // TO Perform swapRoute1 & swapRoute2 to get bscADA on DEXRouter
        const result3 = await targetFiberRouterContract
          .connect(targetSigner)
          .withdrawAndSwap(
            signer.address,
            targetRouterAddress,  // DEX
            amountsOut,  // SwapIn Out of FoundryToken
            amountsOut2, // SwapOut amount of TargetToken
            path2,  // SwapRoute
            "1669318064",
            {
              gasLimit: 1000000,
            }
          );
        const receipt3 = await result3.wait();
        if (receipt3.status == 1) {
          console.log("TN-3: Successfully Swapped Foundry Token to Target Token");
          console.log("Cheers! your bridge and swap was successful !!!");
          console.log("Transaction hash is: ", result3.hash);
        }
      }
    }
  }
}

// Swap 10 Goerli ADA  --> BSC ADA
IONICCheck(
  "0x93e7a4C6FF5f5D786a33076c8F9D380E1bbA7E90",
  "0x93498CD124EE957CCc1E0e7Acb6022Fc6caF3D10",
  "10000000000000000000"
);

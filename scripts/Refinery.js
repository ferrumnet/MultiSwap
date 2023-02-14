const { ethers } = require("ethers");
const axios = require("axios");
require("dotenv").config();
const fundManagerAbi = require("../artifacts/contracts/upgradeable-Bridge/FundManager.sol/FundManager.json");
const fiberRouterAbi = require("../artifacts/contracts/upgradeable-Bridge/FiberRouter.sol/FiberRouter.json");
const tokenAbi = require("../artifacts/contracts/token/Token.sol/Token.json");
const routerAbi = require("../artifacts/contracts/common/uniswap/IUniswapV2Router02.sol/IUniswapV2Router02.json");
const toWei = (i) => ethers.utils.parseEther(i);
const toEther = (i) => ethers.utils.formatEther(i);

//goerli rpc
const sourceNetwork =
  "https://nd-018-780-500.p2pify.com/8d55fdf55750fe8f435ef82b610d1bba";
//bsc rpc
const targetNetwork =
  "https://nd-409-138-440.p2pify.com/a2b2f87cd496703b1cc64ff8e91b7981";

//networks chain id
const sourceNetworkId = 5; //goerli
const targetNetworkId = 97; //bsc

//network providers
const sourceProvider = new ethers.providers.JsonRpcProvider(sourceNetwork);
const targetProvider = new ethers.providers.JsonRpcProvider(targetNetwork);

// user wallet
const signer = new ethers.Wallet(process.env.PRIVATE_KEY0);
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

// goerli FiberRouter contract
const sourceFiberRouterAddress = "0x5d5ced0fCA6485adC11f3F888210e834B9281Cba";
// bsc FiberRouter contract
const targetFiberRouterAddress = "0xA094cb3A05264196f47Ae63e5a7C5eb7995ff37b";

// goerli FiberRouter contract
const sourceFiberRouterContract = new ethers.Contract(
  sourceFiberRouterAddress,
  fiberRouterAbi.abi,
  sourceProvider
);

// bsc FiberRouter contract
const targetFiberRouterContract = new ethers.Contract(
  targetFiberRouterAddress,
  fiberRouterAbi.abi,
  targetProvider
);

//check the requested token exist on the Source network Fund Manager
async function sourceFACCheck(tokenAddress) {
  const isSourceTokenFoundryAsset =
    await sourceFundMangerContract.isFoundryAsset(tokenAddress);
  return isSourceTokenFoundryAsset;
}

//check the requested token exist on the Source network Fund Manager
async function targetFACCheck(tokenAddress, amount) {
  const isTargetTokenFoundryAsset =
    await targetFundMangerContract.isFoundryAsset(tokenAddress);

  const targetFoundryTokenContract = new ethers.Contract(
    tokenAddress,
    tokenAbi.abi,
    targetProvider
  );

  // Liquidity Check for targetFoundryTokken in TargetFundManager
  const targetFoundryAssetLiquidity =
    await targetFoundryTokenContract.balanceOf(
      targetFundMangerContract.address
    );

  if (
    isTargetTokenFoundryAsset == true &&
    Number(targetFoundryAssetLiquidity) > Number(amount)
  ) {
    return true;
  } else {
    return false;
  }
}

//check source token is Refinery asset
async function isSourceRefineryCheck(tokenAddress) {
  const isTokenFoundryAsset = await sourceFACCheck(tokenAddress);
  if (isTokenFoundryAsset == false) {
    return true;
  } else {
    return false;
  }
}

//check target token is Refinery asset
async function isTargetRefineryCheck(tokenAddress, amount) {
  // if target token is a foundry asset or refinery asset
  const isTokenFoundryAsset = await targetFACCheck(tokenAddress, amount);

  const targetFoundryTokenContract = new ethers.Contract(
    targetFoundryTokenAddress,
    tokenAbi.abi,
    targetProvider
  );

  // Liquidity Check for targetFoundryToken in TargetFundManager
  const targetFundMangerLiquidity = await targetFoundryTokenContract.balanceOf(
    targetFundMangerContract.address
  );

  if (
    isTokenFoundryAsset == false &&
    Number(targetFundMangerLiquidity) > Number(amount)
  ) {
    return true;
  } else {
    return false;
  }
}

//swap foundry asset on two networks
async function RefinerySwap(sourcetokenAddress, targetTokenAddress, amount) {
  const isSourceRefineryAsset = isSourceRefineryCheck(
    sourcetokenAddress,
    amount
  );

  // If its a foundry asset then cancel the tx
  if (isSourceRefineryAsset == false) return;

  console.log("SN-1: Source Token is RefineryAsset");
  console.log("   ");
  const sourceTokenContract = new ethers.Contract(
    sourcetokenAddress,
    tokenAbi.abi,
    sourceProvider
  );
  console.log("SN-2: Swap RefineryToken to FouderyToken ...");
  console.log("   ");
  //swap refinery token to the foundry token

  // usdc --> usdt
  let path = [sourcetokenAddress, sourceFoundryTokenAddress];
  // 10 usdc --> 9.89 usdt
  const amounts = await sourceDexContract.getAmountsOut(amount, path);
  const amountsOut = amounts[1];

  // User will allow FiberRouter to use his Tokens for swap on DEX
  await sourceTokenContract
    .connect(sourceSigner)
    .approve(sourceFiberRouterContract.address, amount);

  // SWAP Initiated on DEX through FiberRouter
  const swapResult = await sourceFiberRouterContract
    .connect(sourceSigner)
    .swapAndCross(
      sourceDexContract.address, // DEX Address on Source Network
      amount, // Amount of tokens to be swapped
      amountsOut, // Amount of tokens to be received after swap
      path, // pair of tokens for swap
      "1669318064", // deadline/timeout to complete swap
      targetNetworkId,
      targetFoundryTokenAddress,
      {
        gasLimit: 1000000,
      }
    );
  //wait until the transaction be completed
  const receipt = await swapResult.wait();
  if (receipt.status == 1) {
    console.log("SN-3 SUCCESS: Swapped RefineryToken to FoundryToken!");
    console.log("Transaction hash is: ", swapResult.hash);

    // Check if Target Token is Refinery
    const isTargetRefineryAsset = await isTargetRefineryCheck(
      targetTokenAddress, // target token that needs to be swapped to user (cake)
      amountsOut // foundryToken swapped from source (amount of usdt)
    );

    // If it is a foundry token
    if (isTargetRefineryAsset === false) {
      console.log("TN-1 FoundrySwap: Target Token is a Foundry Asset");
      console.log(
        "TN-2 FoundrySwap: Withdraw FoundryToken from FundManager to User ..."
      );

      //if target token is foundry asset
      // Call FiberRouter to withdraw tokens from FundManager to user's account
      const swapResult1 = await targetFiberRouterContract
        .connect(targetSigner)
        .withdraw(
          targetFoundryTokenAddress, //token address on network 2
          signer.address, //receiver
          amountsOut, //targetToken amount
          { gasLimit: 1000000 }
        );

      const receipt = swapResult1.wait();
      if (receipt.status == 1) {
        console.log(
          "TN-3 SUCCESS: Withdraw FoundryToken on Source Network (SN)!"
        );
        console.log("Transaction hash is: ", swapResult1);
      }
    } else {
      console.log("TN-1 RefinerySwap: Target Token is RefineryAsset");

      console.log(
        "TN-2 RefinerySwap: Withdraw FoundryToken from FundManager for Swap ...."
      );

      console.log(
        "TN-3 RefinerySwap: Swap FoundryToken to TargetToken from DEX...."
      );

      // Swap pair (Foundry, Target)  --> (usdt, cake)
      let path2 = [targetFoundryTokenAddress, targetTokenAddress];

      // Check the swapOut amount of target tokens to be received from DEX
      // 9.89 usdt --> 8 cake
      const amounts2 = await targetDexContract.getAmountsOut(amountsOut, path2);
      const amountsOut2 = amounts2[1];

      // Call FiberRouter to perform swap on DEX
      // Transfer tokens from user wallet to DEX Router
      const swapResult2 = await targetFiberRouterContract
        .connect(targetSigner)
        .withdrawAndSwap(
          signer.address, // user wallet address
          targetRouterAddress, // DEX Address
          amountsOut, // the amount of foundrytoken that needs to be swapped to TargetToken
          amountsOut2, // the amount that will be received after swap from DEX
          path2, // targetToken pair (Foundry, Target)
          "1669318064", // Timeout
          {
            gasLimit: 1000000,
          }
        );
      const receipt3 = await swapResult2.wait();
      if (receipt3.status == 1) {
        console.log("TN-4: Successfully, Swapped FoundryToken to TargetToken");
        console.log("Transaction hash is: ", swapResult2.hash);
        console.log("Cheers! your swap was successful !!!");
      }
    }
  }
}
// Swap 10 USDC from Ethereum to CAKE token on BSC
RefinerySwap(
  "0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C",
  "0xFa60D973F7642B748046464e165A65B7323b0DEE",
  "10000000000000000000"
);

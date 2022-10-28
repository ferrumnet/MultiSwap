const { ethers } = require("ethers");
const axios = require("axios");
require('dotenv').config()
const fundManagerAbi = require("../artifacts/contracts/upgradeable-Bridge/FundManager.sol/FundManager.json");
const fiberRouterAbi = require("../artifacts/contracts/upgradeable-Bridge/FiberRouter.sol/FiberRouter.json");
const tokenAbi = require("../artifacts/contracts/token/Token.sol/Token.json");
const routerAbi = require('../artifacts/contracts/common/uniswap/IUniswapV2Router02.sol/IUniswapV2Router02.json');
const toWei = (i) => ethers.utils.parseEther(i);
const toEther = (i) => ethers.utils.formatEther(i);

//goerli rpc
const sourceNetwork = "https://goerli.infura.io/v3/fa18fa35171744ae8ac35d12baa36ae3";
//bsc rpc
const targetNetwork = "https://data-seed-prebsc-1-s2.binance.org:8545";

//networks chain id
const sourceNetworkId = 5;//goerli
const targetNetworkId = 97;//bsc

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

// goerli FiberRouter contract
const sourceFiberRouterAddress = "0xa20Ea6722D828C9A5d370E6cdB9608d9e0459F26";
// bsc FiberRouter contract
const targetFiberRouterAddress = "0x6147F4c2b20d3638d12600C6F2189e7A890F3Bbf";

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
async function targetFACCheck(tokenAddress) {
  const isTargetTokenFoundryAsset =
  await targetFundMangerContract.isFoundryAsset(tokenAddress);
  return isTargetTokenFoundryAsset;
}


//check source toke is foundry asset
async function isSourceRefineryAsset(tokenAddress, amount) {
  const isTokenFoundryAsset = await targetFACCheck(tokenAddress);

  const tokenContract = new ethers.Contract(
    tokenAddress,
    tokenAbi.abi,
    sourceProvider
  );
  const decimal = await tokenContract.decimals();

  const targetFoundryTokenContract = new ethers.Contract(
    targetFoundryTokenAddress,
    tokenAbi.abi,
    targetProvider
  );

  const targetFundMangerLiquidity = await targetFoundryTokenContract.balanceOf(
    targetFundMangerContract.address
  );
  let path = [tokenAddress, sourceFoundryTokenAddress];
  const amounts = await sourceDexContract.getAmountsOut(amount, path);
  const amountsOut = amounts[1];
  if (isTokenFoundryAsset == false && Number(targetFundMangerLiquidity) > Number(amountsOut)) {
    return true;
  } else {
    return false;
  }
}



//swap foundry asset on two networks
async function RefinerySwap(sourcetokenAddress, targetTokenAddress, amount) {
  const isRefineryAsset = isSourceRefineryAsset(sourcetokenAddress, amount);

  if (isRefineryAsset == false) return;
  console.log('Token is refinery asset')
  const sourceTokenContract = new ethers.Contract(
    sourcetokenAddress,
    tokenAbi.abi,
    sourceProvider
  );
  console.log('swap refinery token to foudry token ...')
  //swap refinery token to the foundry token
  let path = [sourcetokenAddress, sourceFoundryTokenAddress];
  const amounts = await sourceDexContract.getAmountsOut(amount, path);
  const amountsOut = amounts[1];

  // User will allow FiberRouter to use his Tokens for swap on DEX
  await sourceTokenContract.connect(sourceSigner).approve(sourceFiberRouterContract.address, amount);

  // SWAP Initiated on DEX through FiberRouter
  const result = await sourceFiberRouterContract.connect(sourceSigner).swapAndCross(
    sourceDexContract.address,  // DEX Address on Source Network
    amount, // Amount of tokens to be swapped
    amountsOut, // Amount of tokens to be received after swap
    path, // pair of tokens for swap
    '1669318064', // deadline/timeout to complete swap
    targetNetworkId,
    targetFoundryTokenAddress,
    {
      gasLimit: 1000000,
    }
  );
  //wait until the transaction be completed
  const receipt = await result.wait();
  if (receipt.status == 1) {
    console.log('successfully swap in source network !')


    const isTargetTokenFoundry = await targetFACCheck(
      targetTokenAddress,
      amountsOut
    );

    // Check if Target Token is Foundry
    if (isTargetTokenFoundry === true) {
      console.log('Target token is foundry asset')
      console.log('withdraw foundry asset ...')

      //if target token is foundry asset
      // Call FiberRouter to withdraw tokens from FundManager to user's account
      const result = await targetFiberRouterContract.connect(targetSigner).withdraw(
        targetFoundryTokenAddress, //token address on network 2
        signer.address, //receiver
        amountsOut, //targetToken amount
        { gasLimit: 1000000 }
      );

      const receipt = result.wait();
      if (receipt.status == 1) {
        console.log("success withdraw foundry token on source network !");
      }

    } else {
      console.log('target token is refinery asset')
      console.log('withdraw foundry token ....')

      //if target token is not foundry asset
      console.log('swap foundry token to target token ....')

      // Swap pair (Foundry, Target)
      let path2 = [targetFoundryTokenAddress, targetTokenAddress];

      // Check the swapOut amount of target tokens to be received from DEX
      const amounts2 = await targetDexContract.getAmountsOut(amountsOut, path2);
      const amountsOut2 = amounts2[1];

      // Call FiberRouter to perform swap on DEX 
      // Transfer tokens from user wallet to DEX Router
      const result3 = await targetFiberRouterContract.connect(targetSigner).withdrawAndSwap(
        signer.address, // user wallet address
        targetRouterAddress, // DEX Address
        amountsOut,  // the amount that needs to be swapped to TargetToken
        amountsOut2, // the amount that will be received after swap from DEX
        path2, // targetToken pair (Foundry, Target)
        '1669318064', // Timeout
        {
          gasLimit: 1000000,
        }
      );
      const receipt3 = await result3.wait();
      if (receipt3.status == 1) {
        console.log('successfully swap foundry token to target token')
        console.log("Cheers! your bridge and swap was successful !!!");
      }
    }
  }
}

RefinerySwap('0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C', '0xFa60D973F7642B748046464e165A65B7323b0DEE', '10000000')
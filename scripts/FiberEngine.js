const { ethers } = require("ethers");
const axios = require("axios");
const fundManagerAbi = require('../artifacts/contracts/upgradeable-Bridge/FundManager.sol/FundManager.json')
const tokenABI = require('../artifacts/contracts/token/Token.sol/Token.json')

const toWei = (i) => ethers.utils.parseEther(i);
const toEther = (i) => ethers.utils.formatEther(i);

const sourceNetwork = `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`;
const targetNetwork = `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`;

const sourceNetworkID = "5";
const targetNetworkID = "11155111";

const sourceProvider = new ethers.providers.JsonRpcProvider(sourceNetwork);
const targetProvider = new ethers.providers.JsonRpcProvider(targetNetwork);


const sourcefundMangerAddress = process.env.SOURCE_FUND_MANAGER;
const targetFundManagerAddress = process.env.TARGET_FUND_MANAGER;

let tokenX = "0x4C7fe149a42287c747f9487E23B561C4Ea60227A";
let tokenY = "0x2234157B16637AfA6f1A7C1C34b1b80D82b50D82";
let amount = 10;

// Fiber Engine runs the FACCheck (To ensure if its a foundry asset or not)
FACCheck(tokenX, tokenY, amount);

const sourceFundMangerContract = new ethers.Contract(
  sourcefundMangerAddress,
  fundManagerAbi.data.result,
  sourceProvider
);

const targetFundMangerContract = new ethers.Contract(
  targetFundManagerAddress,
  fundManagerAbi.data.result,
  targetProvider
);

//check if source token is foundry asset
async function isSourceFoundryAsset(tokenAddress) {

  const isTokenFoundryAsset = await sourceFundMangerContract.isFoundryAsset(
    tokenAddress
  );

  // No need to check the token's bridge liquidity on sourceNetwork

  if (isTokenFoundryAsset == true) {
        return true;
  } else {
        return false;
  }
}

//check target toke is foundry asset
async function isTargetFoundryAsset(tokenAddress, amount) {
  const targetTokenContract = new ethers.Contract(
    tokenAddress,
    tokenABI,
    targetProvider
  );

  const isTokenFoundryAsset = await targetFundMangerContract.isFoundryAsset(
    tokenAddress
  );
  const fundMangerLiquidity = await targetTokenContract.balanceOf(
    targetFundManagerAddress
  );
  if (isTokenFoundryAsset == true && fundMangerLiquidity > amount) {
    return true;
  } else {
    return false;
  }
}

//swap foundry asset on two networks
async function FACCheck(sourcetokenAddress, targetTokenAddress, amount) {

  // Check if its a foundry asset
  const isFoundryAsset1 = isSourceFoundryAsset(sourcetokenAddress);

  // Check if its a foundry asset & target bridge has enough liquidity
  const isFoundryAsset2 = isTargetFoundryAsset(targetTokenAddress, amount);

  if (isFoundryAsset1 == true && isFoundryAsset2 == true);

  const sourceTokenContract = new ethers.Contract(
    sourcetokenAddress,
    tokenABI,
    sourceProvider
  );

  // If its a Foundry Asset on both Networks then proceed with swap
  await sourceTokenContract.approve(sourceFundMangerContract, amount);
  const result = await sourceFundMangerContract.swap(
    sourcetokenAddress, //token address on network 1
    amount, //token amount
    targetNetworkId, //target network
    targetTokenAddress, //token address on network 2,
    { gasLimit: 1000000 }
  );

  // If funds are swapped to Bridge then 
  // automatically process withdrawal on target network
  const receipt = await result.wait();
  if (receipt.status == 1) {
    const result = await targetFundMangerContract.withdraw(
      targetTokenAddress, //token address on network 2
      user, //reciver
      amount, //targetToken amount
      { gasLimit: 1000000 }
    );

    const receipt = result.wait();
    if (receipt.status == 1) {
      console.log("Token successfully swapped from Network 1 to Network 2");
    }
  }
}


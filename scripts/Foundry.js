const { ethers } = require("ethers");
const axios = require("axios");
const fundManagerAbi = require("../artifacts/contracts/upgradeable-Bridge/FundManager.sol/FundManager.json");
const tokenAbi = require("../artifacts/contracts/token/Token.sol/Token.json");

const toWei = (i) => ethers.utils.parseEther(i);
const toEther = (i) => ethers.utils.formatEther(i);

const sourceNetwork = "https://rpc-bsc.bnb48.club";
const targetNetwork = "https://polygon-rpc.com";

const sourceNetworkId = "56";
const targetNetworkId = "137";

const sourceProvider = new ethers.providers.JsonRpcProvider(sourceNetwork);
const targetProvider = new ethers.providers.JsonRpcProvider(targetNetwork);

const sourcefundMangerAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
const targetFundManagerAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

const sourceFundMangerContract = new ethers.Contract(
  sourcefundMangerAddress,
  fundManagerAbi.abi,
  sourceProvider
);

const targetFundMangerContract = new ethers.Contract(
  targetFundManagerAddress,
  fundManagerAbi.abi,
  targetProvider
);

//check source toke is foundry asset
async function isSourceFoundryAsset(tokenAddress, amount) {
  const sourceTokenContract = new ethers.Contract(
    tokenAddress,
    tokenAbi,
    sourceProvider
  );
  const isTokenFoundryAsset = await sourceFundMangerContract.isFoundryAsset(
    tokenAddress
  );
  const fundMangerLiquidity = await sourceTokenContract.balanceOf(
    sourceFundMangerContract
  );
  if (isTokenFoundryAsset == true && fundMangerLiquidity > amount) {
    return true;
  } else {
    return false;
  }
}

//check target toke is foundry asset
async function isTargetFoundryAsset(tokenAddress, amount) {
  const targetTokenContract = new ethers.Contract(
    tokenAddress,
    tokenAbi,
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
  const isFoundryAsset1 = isSourceFoundryAsset(sourcetokenAddress, amount);
  const isFoundryAsset2 = isTargetFoundryAsset(targetTokenAddress, amount);

  if (isFoundryAsset1 == true && isFoundryAsset2 == true);
  const sourceTokenContract = new ethers.Contract(
    sourcetokenAddress,
    tokenAbi,
    sourceProvider
  );

  await sourceTokenContract.approve(sourceFundMangerContract, amount);
  const swapResult = await sourceFundMangerContract.swap(
    sourcetokenAddress, //token address on network 1
    amount, //token amount
    targetNetworkId, //target network
    targetTokenAddress, //token address on network 2,
    { gasLimit: 1000000 }
  );

  const receipt = await swapResult.wait();
  if (receipt.status == 1) {
    const swapResult = await targetFundMangerContract.withdraw(
      targetTokenAddress, //token address on network 2
      user, //reciver
      amount, //targetToken amount
      { gasLimit: 1000000 }
    );

    const receipt = swapResult.wait();
    if (receipt.status == 1) {
      console.log("success");
    }
  }
}

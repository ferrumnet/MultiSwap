const { ethers } = require("ethers");
const axios = require("axios");
require("dotenv").config();
const fundManagerAbi = require("../artifacts/contracts/upgradeable-Bridge/FundManager.sol/FundManager.json");
const fiberRouterAbi = require("../artifacts/contracts/upgradeable-Bridge/FiberRouter.sol/FiberRouter.json");
const tokenAbi = require("../artifacts/contracts/token/Token.sol/Token.json");
const routerAbi = require("./abi");
const toWei = (i) => ethers.utils.parseEther(i);
const toEther = (i) => ethers.utils.formatEther(i);

//goerli rpc
const sourceNetwork = process.env.SOURCE_CHAIN_RPC;
//bsc rpc
const targetNetwork = process.env.DESTINATION_CHAIN_RPC;

//networks chain id
const sourceChainId = process.env.SOURCE_CHAIN_ID;
const targetChainId = process.env.DESTINATION_CHAIN_ID;

//network providers
const sourceProvider = new ethers.providers.JsonRpcProvider(sourceNetwork);
const targetProvider = new ethers.providers.JsonRpcProvider(targetNetwork);

// user wallet
const sourceSigner = new ethers.Wallet(
  process.env.SOURCE_CHAIN_PRIV_KEY
).connect(sourceProvider);
const targetSigner = new ethers.Wallet(
  process.env.DESTINATION_CHAIN_PRIV_KEY
).connect(targetProvider);

// goerli fundManager contract
const sourcefundMangerAddress = process.env.SOURCE_FUND_MANAGER_CONTRACT;
// bsc fundManager contract
const targetFundManagerAddress = process.env.DESTINATION_FUND_MANAGER_CONTRACT;

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
const sourceFiberRouterAddress = process.env.SOURCE_FIBER_ROUTER_CONTRACT;
// bsc fundManager contract
const targetFiberRouterAddress = process.env.DESTINATION_FIBER_ROUTER_CONTRACT;

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

//swap foundry asset on two networks
async function swap(
  sourcetokenAddress,
  targetFoundryTokenAddress,
  targetTokenAddress,
  amount
) {
  const isFoundryAsset = sourceFACCheck(sourcetokenAddress, amount);

  if (isFoundryAsset == false) return;
  console.log("Token is foundry asset");
  console.log("add foundry asset in source network");
  const sourceTokenContract = new ethers.Contract(
    sourcetokenAddress,
    tokenAbi.abi,
    sourceProvider
  );
  const approveRes = await sourceTokenContract
    .connect(sourceSigner)
    .approve(sourceFiberRouterContract.address, amount);
  await approveRes.wait();
  const result = await sourceFiberRouterContract
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
  const receipt = await result.wait();
  if (receipt.status == 1) {
    console.log("successfully add foundry in source network !");
    const isTargetTokenFoundry = await targetFACCheck(
      targetTokenAddress,
      amount
    );
    if (isTargetTokenFoundry === true) {
      console.log("Target token is foundry asset");
      console.log("withdraw and swap to foundry asset ...");
      //if target token is foundry asset
      const result = await targetFiberRouterContract
        .connect(targetSigner)
        .withdrawAndSwapToFoundry(
          targetFoundryTokenAddress, //token address on network 2
          targetTokenAddress,
          targetSigner.address, //reciver
          amount, //targetToken amount
          { gasLimit: 1000000 }
        );

      const receipt = await result.wait();
      if (receipt.status == 1) {
        console.log("successfully swap foundry token to target foundry token");
        console.log("Cheers! your bridge and swap was successful !!!");
      } else {
        console.log("failed to withdraw and swap foundry token");
      }
    }
  }
}

swap(
  process.env.SOURCE_CHAIN_TOKEN,
  process.env.DESTINATION_CHAIN_SOURCE_TOKEN,
  process.env.DESTINATION_CHAIN_TOKEN,
  "10000000000000000000"
);

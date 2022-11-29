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
const sourceNetwork =
  "https://goerli.infura.io/v3/fa18fa35171744ae8ac35d12baa36ae3";
//bsc rpc
const targetNetwork =
  "https://apis.ankr.com/f9946df03b9741df9e20e6d376021c81/17d51fb5735bba322c78e521ac58c161/binance/full/test";

//networks chain id
const goeliChainId = 5;
const bscChainId = 97;

//networks chain id
const sourceChainId = 5;
const targetChainId = 97;

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

// link token on goerli and bsc netwroks as other foundry asset
const sourceLinkAddress = "0x6CD74120C67A5c0C1Ed6f34a3c40f3224E4Cf5bC"; //goerli link
const targetLinkAddress = "0x800181891a79A3Aa28f271884c7c6cAD07847967"; // bsc link

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
const sourceFiberRouterAddress = "0x757FaA8A92b6B813f96058725eC731F75cE0C59f";
// bsc fundManager contract
const targetFiberRouterAddress = "0x6Cb6Aa70511C9289FbD212E5e320c799Ed2a7Be9";

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
async function swap(sourcetokenAddress, targetTokenAddress, amount) {
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
          signer.address, //reciver
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
  "0x636b346942ee09Ee6383C22290e89742b55797c5",
  "0x800181891a79A3Aa28f271884c7c6cAD07847967",
  "10000000000000000000"
);

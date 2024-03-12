// scripts/deployAll.js
const { ethers } = require('hardhat');

async function main() {
// Compile the contracts and libraries
 await hre.run('compile');

  // Deploy FundManager (Parent)
  const FundManager = await ethers.getContractFactory('FundManager');
  const fundManager = await FundManager.deploy();
  await fundManager.deployed();
  console.log('FundManager deployed to:', fundManager.address);
  console.log("Verifing...");
  await hre.run("verify:verify", {
    address: fundManager.address,
    constructorArguments: [],
    contract: "contracts/multiswap-contracts/FundManager.sol:FundManager"
  });
  console.log("Contract verified successfully !");

  // Deploy ForgeManager (Child)
  const ForgeManager = await ethers.getContractFactory('ForgeFundManager');
  const forgeManager = await ForgeManager.deploy();
  await forgeManager.deployed();
  console.log('ForgeManager deployed to:', forgeManager.address);
  console.log("Verifing...");
  await hre.run("verify:verify", {
    address: forgeManager.address,
    constructorArguments: [],
    contract: "contracts/multiswap-contracts/ForgeManager.sol:ForgeFundManager"
  });
  console.log("Contract verified successfully !");

  // Deploy OneInchDecoder library
  const OneInchDecoder = await ethers.getContractFactory('OneInchDecoder');
  const oneInchDecoder = await OneInchDecoder.deploy();
  await oneInchDecoder.deployed();
  console.log('OneInchDecoder library deployed to:', oneInchDecoder.address);

  // Replace these with actual values
  const wethAddress = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1";
  const oneInchAggregatorRouterAddress = "0x1111111254EEB25477B68fb85Ed929f73A960582";
  const poolFundManager = fundManager.address;
  const poolForge = forgeManager.address;

  // Deploy FiberRouter with the address of OneInchDecoder and other parameters
  const FiberRouter = await ethers.getContractFactory('FiberRouter', {
    libraries: {
      OneInchDecoder: oneInchDecoder.address,
    },
  });
  const fiberRouter = await FiberRouter.deploy(wethAddress, oneInchAggregatorRouterAddress, poolFundManager);
  await fiberRouter.deployed();
  console.log('FiberRouter deployed to:', fiberRouter.address);
  console.log("Verifing...");
  await hre.run("verify:verify", {
    address: oneInchDecoder.address,
    constructorArguments: [],
  });
  await hre.run("verify:verify", {
    address: fiberRouter.address,
    constructorArguments: [wethAddress, oneInchAggregatorRouterAddress, poolFundManager],
    libraries: {
      OneInchDecoder : oneInchDecoder.address,
    },
  });
  console.log("Contract verified successfully !");

  // Deploy MultiswapForge with the address of FiberRouter and other parameters
  const MultiswapForge = await ethers.getContractFactory('MultiSwapForge', {
    libraries: {
      OneInchDecoder: oneInchDecoder.address,
    },
  });

  const multiswapForge = await MultiswapForge.deploy(wethAddress, oneInchAggregatorRouterAddress, poolForge);
  await multiswapForge.deployed();
  console.log('MultiswapForge deployed to:', multiswapForge.address);
  await hre.run("verify:verify", {
    address: multiswapForge.address,
    constructorArguments: [wethAddress, oneInchAggregatorRouterAddress, poolForge],
    libraries: {
      OneInchDecoder : oneInchDecoder.address,
    },
  });
  console.log("Contract verified successfully !");

}




main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

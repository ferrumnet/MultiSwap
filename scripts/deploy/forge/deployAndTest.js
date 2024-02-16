// scripts/deployAll.js
const { ethers } = require('hardhat');

async function main() {
// Compile the contracts and libraries
 await hre.run('compile');

// Deploying ERC20 contract
  const ERC20 = await ethers.getContractFactory("ERC20");
  const erc20 = await upgrades.deployProxy(ERC20, ["TestToken", "TST", 1000000000]);
  await erc20.deployed();
  console.log("ERC20 Token deployed to:", erc20.address);

  // Deploy FundManager (Parent)
  const FundManager = await ethers.getContractFactory('FundManager');
  const fundManager = await FundManager.deploy();
  await fundManager.deployed();
  console.log('FundManager deployed to:', fundManager.address);

  // Deploy ForgeManager (Child)
  const ForgeManager = await ethers.getContractFactory('ForgeFundManager');
  const forgeManager = await ForgeManager.deploy();
  await forgeManager.deployed();
  console.log('ForgeManager deployed to:', forgeManager.address);

  const pool = forgeManager.address;

  // Deploy OneInchDecoder library
  const OneInchDecoder = await ethers.getContractFactory('OneInchDecoder');
  const oneInchDecoder = await OneInchDecoder.deploy();
  await oneInchDecoder.deployed();
  console.log('OneInchDecoder library deployed to:', oneInchDecoder.address);

  // Replace these with actual values
  const wethAddress = "0x";
  const oneInchAggregatorRouterAddress = "0x";
  const poolAddress = pool;

  // Deploy FiberRouter with the address of OneInchDecoder and other parameters
  const FiberRouter = await ethers.getContractFactory('FiberRouter', {
    libraries: {
      OneInchDecoder: oneInchDecoder.address,
    },
  });
  const fiberRouter = await FiberRouter.deploy(wethAddress, oneInchAggregatorRouterAddress, poolAddress);
  await fiberRouter.deployed();
  console.log('FiberRouter deployed to:', fiberRouter.address);

  // Deploy MultiswapForge with the address of FiberRouter and other parameters
  const MultiswapForge = await ethers.getContractFactory('MultiSwapForge', {
    libraries: {
      OneInchDecoder: oneInchDecoder.address,
    },
  });
  const multiswapForge = await MultiswapForge.deploy(wethAddress, oneInchAggregatorRouterAddress, poolAddress);
  await multiswapForge.deployed();
  console.log('MultiswapForge deployed to:', multiswapForge.address);

// Set Forge address for MultiswapForge
  await forgeManager.setRouter(multiswapForge.address);
  console.log("Forge added successfully!");
 // Add the ERC20 token as a foundry asset
  await forgeManager.addFoundryAsset(erc20.address);
  console.log("Foundry token added successfully!");

  // Approve the ForgeManager/Pool contract
  await erc20.approve(forgeManager.address, ethers.constants.MaxUint256);
  console.log("Token approved successfully!");
  // Add liquidity to the ERC20 token
  const liquidityAmount = 1000; 
  await forgeManager.addLiquidity(erc20.address, liquidityAmount);
  console.log("Liquidity added successfully!");

  const gasEstimation = await multiswapForge.estimateGas.estimateGasForWithdrawSigned(
    erc20.address, 
    fundManager.address, 
    100,  
    ethers.utils.formatBytes32String("salt"),
    1707296470,
    "0x74f69192c2c9eb585885dcc7b7212f01f251e7367ac859e49ae8897db14ec2bd5347a27b18a81d941c4a9bbcb2f93ef161ad6ab2ada97c9e3f4423f8eaf76e741c"
  );

  console.log("Gas estimation:", gasEstimation);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// scripts/deployAll.js
const { ethers } = require('hardhat');

async function main() {

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

  // Deploy FiberRouter with the address of OneInchDecoder and other parameters
  const FiberRouter = await ethers.getContractFactory('FiberRouter');
  const fiberRouter = await FiberRouter.deploy();
  await fiberRouter.deployed();
  console.log('FiberRouter deployed to:', fiberRouter.address);
  console.log("Verifing...");
  await hre.run("verify:verify", {
    address: fiberRouter.address,
    constructorArguments: []
  });
  console.log("Contract verified successfully !");

  // Deploy MultiswapForge with the address of FiberRouter and other parameters
  const MultiswapForge = await ethers.getContractFactory('MultiSwapForge');
  const multiswapForge = await MultiswapForge.deploy();
  await multiswapForge.deployed();
  console.log('MultiswapForge deployed to:', multiswapForge.address);
  await hre.run("verify:verify", {
    address: multiswapForge.address,
    constructorArguments: [],
  });
  console.log("Contract verified successfully !");

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

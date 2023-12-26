const { ethers, upgrades } = require("hardhat");

async function main() {
  const FiberRouter = await hre.ethers.getContractFactory("FiberRouter");
  const fiberRouter = await FiberRouter.deploy();

  await fiberRouter.deployed();

  console.log("FiberRouter deployed to:", fiberRouter.address);

  if (network.name == "hardhat") return;
  await fundManager.deployTransaction.wait(6);
  console.log("Verifing...");
  await hre.run("verify:verify", {
    address: fundManager.address,
    constructorArguments: [],
  });
  console.log("Contract verified successfully !");
}

// npx hardhat verify --network bscMainnet 0x37D6421b1D5724421444dD33338d3043921594dB "Constructor argument 1"
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
//npx hardhat run --network sepolia scripts/deploy.js

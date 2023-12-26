const { ethers, upgrades } = require("hardhat");

async function main() {
  const FiberRouter = await hre.ethers.getContractFactory("FiberRouter");
  const fiberRouter = await FiberRouter.deploy();

  await fiberRouter.deployed();

  console.log("FiberRouter deployed to:", fiberRouter.address);

  if (network.name == "hardhat") return;
  await fiberRouter.deployTransaction.wait(21);
  console.log("Verifing...");
  await hre.run("verify:verify", {
    address: fiberRouter.address,
    constructorArguments: [],
  });
  console.log("Contract verified successfully !");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

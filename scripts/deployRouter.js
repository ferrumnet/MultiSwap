const { ethers, upgrades } = require("hardhat");

async function main() {
  const FiberRouter = await ethers.getContractFactory("FiberRouter");
  console.log("Deploying Router...");

  const fiberRouter = await upgrades.deployProxy(FiberRouter, {
    initializer: "initialize",
  });
  await fiberRouter.deployed();

  console.log(`Router deployed to ${fiberRouter.address}`);

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

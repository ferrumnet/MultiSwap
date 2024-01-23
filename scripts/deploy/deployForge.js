const { ethers, upgrades } = require("hardhat");

async function main() {
  const MultiSwapForge = await hre.ethers.getContractFactory("MultiSwapForge");

  const routerAddress = "0x"; // Router Address

  // Deploy the contract
  const multiSwapForge = await MultiSwapForge.deploy(
    routerAddress
  );

  await multiSwapForge.deployed();

  console.log("Forge Contract deployed to:", multiSwapForge.address);

  if (network.name == "hardhat") return;
  await multiSwapForge.deployTransaction.wait(21);
  console.log("Verifing...");
  await hre.run("verify:verify", {
    address: multiSwapForge.address,
    constructorArguments: [routerAddress],
  });
  console.log("Contract verified successfully !");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

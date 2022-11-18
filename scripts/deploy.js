const { ethers, upgrades } = require("hardhat");

async function main() {
  const FundManager = await ethers.getContractFactory("FundManager");
  console.log("Deploying FundManager...");

  const fundManager = await upgrades.deployProxy(FundManager, {
    initializer: "initialize",
  });
  await fundManager.deployed();

  console.log(`FundManager deployed to ${fundManager.address}`);

  if (network.name == "hardhat") return;
  await fundManager.deployTransaction.wait(6);
  console.log("Verifing...");
  await hre.run("verify:verify", {
    address: fundManager.address,
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
//npx hardhat run --network sepolia scripts/deploy.js

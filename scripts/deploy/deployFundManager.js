const { ethers, upgrades } = require("hardhat");
async function main() {
  const FundManager = await hre.ethers.getContractFactory("FundManager");
  const fundManager = await FundManager.deploy();
  await fundManager.deployed();

  
  console.log("FundManager deployed to:", fundManager.address);
  if (network.name == "hardhat") return;
  await fundManager.deployTransaction.wait(21);
  console.log("Verifing...");
  await hre.run("verify:verify", {
    address: fundManager.address,
    constructorArguments: [],
  });
  console.log("Contract verified successfully !");
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
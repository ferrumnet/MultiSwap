const { ethers, upgrades } = require("hardhat");
async function main() {
  const FundManager = await hre.ethers.getContractFactory("FundManager");
  const forgeAddress = "0x"; // Router Address
  const fundManager = await FundManager.deploy(
    forgeAddress
  );
  await fundManager.deployed();
  console.log("FundManager deployed to:", fundManager.address);
  if (network.name == "hardhat") return;
  await fundManager.deployTransaction.wait(21);
  console.log("Verifing...");
  await hre.run("verify:verify", {
    address: fundManager.address,
    constructorArguments: [forgeAddress],
  });
  console.log("Contract verified successfully !");
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
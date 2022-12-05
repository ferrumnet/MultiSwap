const { ethers, upgrades } = require("hardhat");
const toEther = (number) => ethers.utils.formatEther(number);
const toWei = (number) => ethers.utils.parseEther(number);
async function main() {
  const TokenY = await ethers.getContractFactory("Token");
  console.log("Deploying tokenY...");

  const tokenY = await upgrades.deployProxy(
    TokenY,
    ["tokenY", "TKY", toWei("10000000000")],
    { initializer: "initialize" }
  );
  await tokenY.deployed();

  console.log(`tokenY deployed to ${tokenY.address}`);

  if (network.name == "hardhat") return;
  await tokenY.deployTransaction.wait(6);
  console.log("Verifing...");
  await hre.run("verify:verify", {
    address: tokenY.address,
    constructorArguments: [],
  });
  console.log("tokenY Contract verified successfully !");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

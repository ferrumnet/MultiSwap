const { ethers, upgrades } = require("hardhat");
const toEther = (number) => ethers.utils.formatEther(number);
const toWei = (number) => ethers.utils.parseEther(number);
async function main() {
  const TokenX = await ethers.getContractFactory("Token");
  console.log("Deploying TokenX...");

  const tokenX = await upgrades.deployProxy(
    TokenX,
    ["TokenX", "TKX", toWei("10000000000")],
    { initializer: "initialize" }
  );
  await tokenX.deployed();

  console.log(`tokenX deployed to ${tokenX.address}`);

  if (network.name == "hardhat") return;
  await tokenX.deployTransaction.wait(6);
  console.log("Verifing...");
  await hre.run("verify:verify", {
    address: tokenX.address,
    constructorArguments: [],
  });
  console.log("TokenX Contract verified successfully !");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

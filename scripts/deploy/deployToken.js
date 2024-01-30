const hre = require("hardhat");

async function main() {

   const erc20 = await hre.ethers.deployContract("ERC20");
   console.log(erc20.address)

   await erc20.waitForDeployment();
}

main().catch((error) => {
   console.error(error);
   process.exitCode = 1;
});

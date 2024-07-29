const hre = require("hardhat");

async function main() {
   const ERC20 = await ethers.getContractFactory('ERC20');
   const erc20 = await ERC20.deploy();
   await erc20.deployed();
   console.log('ERC20 deployed to:', erc20.address);
   console.log("Verifing...");
   await hre.run("verify:verify", {
     address: erc20.address,
     constructorArguments: []
   });
   console.log("Contract verified successfully !");
}

main().catch((error) => {
   console.error(error);
   process.exitCode = 1;
});

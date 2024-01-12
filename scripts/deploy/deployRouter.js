const { ethers } = require("hardhat");
async function main() {
    // Deploy the library
    const Library = await hre.ethers.getContractFactory("OneInchDecoder");
    const library = await Library.deploy();
    await library.deployed();
  const FiberRouter = await hre.ethers.getContractFactory("FiberRouter", {
    libraries: {
      OneInchDecoder : library.address,
    },
  });

  const wethAddress = "0x"; // WETH Arbitrum
  const oneInchAggregator = "0x";
  const poolAddress = "0x"; // Pool Address

  // Deploy the contract
  const fiberRouter = await FiberRouter.deploy(
    wethAddress,
    oneInchAggregator,
    poolAddress
  );

  await fiberRouter.deployed();
  console.log("FiberRouter deployed to:", fiberRouter.address);
  if (network.name == "hardhat") return;
  await fiberRouter.deployTransaction.wait(21);
  console.log("Verifing...");
  await hre.run("verify:verify", {
    address: library.address,
    constructorArguments: [],
  });
  await hre.run("verify:verify", {
    address: fiberRouter.address,
    constructorArguments: [wethAddress, oneInchAggregator, poolAddress],
    libraries: {
      OneInchDecoder : library.address,
    },
  });
  console.log("Contract verified successfully !");
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});







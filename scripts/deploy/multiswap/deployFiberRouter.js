const { ethers } = require("hardhat");

// Function to create a delay
function delay(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

// Function to log countdown
async function logCountdown(seconds) {
  for (let i = seconds; i > 0; i--) {
    console.log(`Waiting ${i} seconds for block confirmations...`);
    await delay(1); // wait for 1 second before logging the next countdown
  }
}

async function main() {
  // Compile the contracts and libraries
  await hre.run('compile');

  // Deploy the OneInchDecoder library
  const OneInchDecoder = await ethers.getContractFactory("OneInchDecoder");
  const oneInchDecoder = await OneInchDecoder.deploy();
  await oneInchDecoder.deployed();
  console.log("OneInchDecoder library deployed to:", oneInchDecoder.address);
  // Wait for 25 seconds before verification
  await logCountdown(25); // This logs the countdown and waits

  console.log("Verifing...");
  await hre.run("verify:verify", {
    address: oneInchDecoder.address,
    constructorArguments: [],
  });

  // Attach to the already deployed FerrumDeployer contract
  const ferrumDeployerAddress = "0x17EA1C55E2E16B57a34932d5b96A749Cd20A6104";
  const FerrumDeployer = await ethers.getContractFactory("FerrumDeployer");
  const ferrumDeployer = await FerrumDeployer.attach(ferrumDeployerAddress);

  const initData = "0x";

  console.log(`initData: `, initData);
  // Get the contract factory for FiberRouter, linking the OneInchDecoder library
  const FiberRouter = await ethers.getContractFactory("FiberRouter", {
    libraries: {
      "contracts/common/oneInch/OneInchDecoder.sol:OneInchDecoder": oneInchDecoder.address
    }
  });

  // Compute the bytecode of FiberRouter with initData
  const bytecodeWithInitData = FiberRouter.bytecode + initData.slice(2);

  // Compute a unique salt for deployment
  // const salt = ethers.utils.formatBytes32String(new Date().getTime().toString());
  const salt = "0x3137303931363532303433393900000000000000000000000000000000000000";
  console.log(`Salt: `, salt);

  // Deploy FiberRouter using FerrumDeployer's deployOwnable function
  const ownerAddress = "0xdCd60Be5b153d1884e1E6E8C23145D6f3546315e"; // Replace with the desired owner address
  const deploymentTx = await ferrumDeployer.deployOwnable(salt, ownerAddress, initData, bytecodeWithInitData);
  const receipt = await deploymentTx.wait();

  const fiberRouterAddress = receipt.events.find((event) => event.event === 'DeployedWithData').args[0];
  console.log("FiberRouter deployed to:", fiberRouterAddress);

  // Wait for 25 seconds before verification
  await logCountdown(25); // This logs the countdown and waits

  console.log("Verifing...");
  await hre.run("verify:verify", {
    address: fiberRouterAddress,
    constructorArguments: [],
    libraries: {
      OneInchDecoder: oneInchDecoder.address,
    },
  });
  console.log("Contract verified successfully !");
}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});







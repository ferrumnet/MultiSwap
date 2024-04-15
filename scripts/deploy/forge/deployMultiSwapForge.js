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

    // Attach to the already deployed FerrumDeployer contract
    const ferrumDeployerAddress = "0x17EA1C55E2E16B57a34932d5b96A749Cd20A6104";
    const FerrumDeployer = await ethers.getContractFactory("FerrumDeployer");
    const ferrumDeployer = await FerrumDeployer.attach(ferrumDeployerAddress);

    // Prepare the initialization data for FiberRouter
    const initData = "0x";

    // Get the contract factory for MultiswapForge
    const MultiswapForge = await ethers.getContractFactory("MultiSwapForge");

  // Compute the bytecode of MultiswapForge with initData (slicing 0x)
  const bytecodeWithInitData = MultiswapForge.bytecode + initData.slice(2);
  // console.log(`bytecodeWithInitData: `, bytecodeWithInitData);

  // Compute a unique salt for deployment
  const salt = ethers.utils.formatBytes32String(new Date().getTime().toString());
  // const salt = "0x3137303931363539373833393700000000000000000000000000000000000000";
  console.log('Salt: ', salt);

  // Deploy MultiswapForge using FerrumDeployer's deployOwnable function
  const ownerAddress = ""; // Replace with the desired owner address
  const deploymentTx = await ferrumDeployer.deployOwnable(salt, ownerAddress, initData, bytecodeWithInitData);
  const receipt = await deploymentTx.wait();
  // console.log('receipt: ', receipt);

  const multiswapForgeAddress = receipt.events.find((event) => event.event === 'DeployedWithData').args[0];
  console.log("ForgeFundManager deployed to:", multiswapForgeAddress);

  // Wait for 25 seconds before verification
  await logCountdown(25); // This logs the countdown and waits

  console.log("Verifing...");
  await hre.run("verify:verify", {
    address: multiswapForgeAddress,
    constructorArguments: [],
  });
  console.log("Contract verified successfully !");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
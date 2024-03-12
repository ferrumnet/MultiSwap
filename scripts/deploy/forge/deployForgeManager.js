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
    // Compile the contracts
    await hre.run('compile');

    // Attach to the already deployed FerrumDeployer contract
    const ferrumDeployerAddress = "0x17EA1C55E2E16B57a34932d5b96A749Cd20A6104";
    const FerrumDeployer = await ethers.getContractFactory("FerrumDeployer");
    const ferrumDeployer = await FerrumDeployer.attach(ferrumDeployerAddress);

    // Get the contract factory for ForgeFundManager
    const ForgeFundManager = await ethers.getContractFactory("ForgeFundManager");

    // Prepare the initialization data for ForgeFundManager
    // Replace these addresses with the actual configuration data needed for ForgeFundManager
    const initData = '0x';

    // Compute the bytecode of ForgeFundManager
    const bytecode = ForgeFundManager.bytecode;

    // Compute a unique salt for deployment
    // const salt = ethers.utils.formatBytes32String(new Date().getTime().toString());
    const salt = "0x3137303931363535363530303700000000000000000000000000000000000000";
    console.log("Salt: ", salt);

    // Specify the owner address to which the ownership of the contract will be transferred
    const ownerAddress = "0xdCd60Be5b153d1884e1E6E8C23145D6f3546315e"; // Replace with the desired owner address

    // Deploy ForgeFundManager using FerrumDeployer's deployOwnable
    const deploymentTx = await ferrumDeployer.deployOwnable(salt, ownerAddress, initData, bytecode);
    const receipt = await deploymentTx.wait();
    // console.log('receipt: ', receipt);

    const forgeFundManagerAddress = receipt.events.find((event) => event.event === 'DeployedWithData').args[0];
    console.log("ForgeFundManager deployed to:", forgeFundManagerAddress);
    
    // Wait for x seconds before verification
    await logCountdown(25); // This logs the countdown and waits

    console.log("Verifing...");
    


    await hre.run("verify:verify", {
      address: forgeFundManagerAddress,
      constructorArguments: [],
      contract: "contracts/multiswap-contracts/ForgeManager.sol:ForgeFundManager"
    });
    console.log("Contract verified successfully !");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

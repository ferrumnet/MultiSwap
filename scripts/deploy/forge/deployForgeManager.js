const { ethers } = require("hardhat");

async function main() {
    // Compile the contracts
    await hre.run('compile');

    // Attach to the already deployed FerrumDeployer contract
    const ferrumDeployerAddress = "0x";
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
    const salt = ethers.utils.formatBytes32String(new Date().getTime().toString());

    // Specify the owner address to which the ownership of the contract will be transferred
    const ownerAddress = "0x"; // Replace with the desired owner address

    // Deploy ForgeFundManager using FerrumDeployer's deployOwnable
    const deploymentTx = await ferrumDeployer.deployOwnable(salt, ownerAddress, initData, bytecode);
    const receipt = await deploymentTx.wait();
    console.log('receipt: ', receipt);

    const forgeFundManagerAddress = receipt.events.find((event) => event.event === 'DeployedWithData').args[0];
  console.log("ForgeFundManager deployed to:", forgeFundManagerAddress);
  console.log("Verifing...");
  await hre.run("verify:verify", {
    address: forgeFundManagerAddress,
    constructorArguments: [],
  });
  console.log("Contract verified successfully !");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

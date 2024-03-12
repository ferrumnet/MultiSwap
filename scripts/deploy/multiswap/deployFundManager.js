const { ethers } = require("hardhat");

async function main() {
    // Compile the contracts
    await hre.run('compile');

    // Attach to the already deployed FerrumDeployer contract
    const ferrumDeployerAddress = "0x17EA1C55E2E16B57a34932d5b96A749Cd20A6104";
    const FerrumDeployer = await ethers.getContractFactory("FerrumDeployer");
    const ferrumDeployer = await FerrumDeployer.attach(ferrumDeployerAddress);

    // Get the contract factory for FundManager
    const FundManager = await ethers.getContractFactory("FundManager");

    // Prepare the initialization data for FundManager
    // Replace these addresses with the actual configuration data needed for FundManager
    const initData = '0x';

    // Compute the bytecode of FundManager
    const bytecode = FundManager.bytecode;

    // Compute a unique salt for deployment
    const salt = ethers.utils.formatBytes32String(new Date().getTime().toString());

    // Specify the owner address to which the ownership of the contract will be transferred
    const ownerAddress = "0xB5d1E1Ff700CFC0c687F1Fc99284E94ab0ef63E5"; // Replace with the desired owner address

    // Deploy FundManager using FerrumDeployer's deployOwnable
    const deploymentTx = await ferrumDeployer.deployOwnable(salt, ownerAddress, initData, bytecode);
    const receipt = await deploymentTx.wait();

    const fundManagerAddress = receipt.events.find((event) => event.event === 'DeployedWithData').args[0];
    console.log("FundManager deployed to:", fundManagerAddress);
    console.log("Verifing...");
    await hre.run("verify:verify", {
      address: fundManagerAddress,
      constructorArguments: [],
      contract: "contracts/multiswap-contracts/FundManager.sol:FundManager"
    });
    console.log("Contract verified successfully !");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

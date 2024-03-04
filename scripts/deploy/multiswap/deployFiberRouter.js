const { ethers } = require("hardhat");

async function main() {
    // Compile the contracts and libraries
    await hre.run('compile');

    // Attach to the already deployed FerrumDeployer contract
    const ferrumDeployerAddress = "0x17EA1C55E2E16B57a34932d5b96A749Cd20A6104";
    const FerrumDeployer = await ethers.getContractFactory("FerrumDeployer");
    const ferrumDeployer = await FerrumDeployer.attach(ferrumDeployerAddress);

    // Prepare the initialization data for FiberRouter
    const initData = "0x";

    // Get the contract factory for FiberRouter, linking the OneInchDecoder library
    const FiberRouter = await ethers.getContractFactory("FiberRouter");

    // Compute the bytecode of FiberRouter with initData
    const bytecodeWithInitData = FiberRouter.bytecode + initData.slice(2);

    // Compute a unique salt for deployment
    const salt = ethers.utils.formatBytes32String(new Date().getTime().toString());

    // Deploy FiberRouter using FerrumDeployer's deployOwnable function
    const ownerAddress = ""; // Replace with the desired owner address
    const deploymentTx = await ferrumDeployer.deployOwnable(salt, ownerAddress, initData, bytecodeWithInitData);
    const receipt = await deploymentTx.wait();

    const fiberRouterAddress = receipt.events.find((event) => event.event === 'DeployedWithData').args[0];
    console.log("FiberRouter deployed to:", fiberRouterAddress);
    console.log("Verifing...");
    await hre.run("verify:verify", {
      address: fiberRouterAddress,
      constructorArguments: [],
    });
    console.log("Contract verified successfully !");
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});







const { ethers } = require("hardhat");

async function main() {
    // Compile the contracts
    await hre.run('compile');

    // Attach to the already deployed FerrumDeployer contract
    const ferrumDeployerAddress = "ferrumDeployerAddress";
    const FerrumDeployer = await ethers.getContractFactory("FerrumDeployer");
    const ferrumDeployer = await FerrumDeployer.attach(ferrumDeployerAddress);

    // Prepare the initialization data for MultiswapForge
    // Replace the address below with the actual router address
    const routerAddress = "routerAddress"; // Router address here
    const initData = ethers.utils.defaultAbiCoder.encode(
        ["address"],
        [routerAddress]
    );

    // Get the contract factory for MultiswapForge
    const MultiswapForge = await ethers.getContractFactory("MultiswapForge");

    // Compute the bytecode of MultiswapForge with initData
    const bytecodeWithInitData = MultiswapForge.bytecode + initData.slice(2);

    // Compute a unique salt for deployment
    const salt = ethers.utils.formatBytes32String(new Date().getTime().toString());

    // Deploy MultiswapForge using FerrumDeployer's deployOwnable function
    const ownerAddress = "ownerAddress"; // Replace with the desired owner address
    const deploymentTx = await ferrumDeployer.deployOwnable(salt, ownerAddress, initData, bytecodeWithInitData);
    const receipt = await deploymentTx.wait();

    const forgeAddress = receipt.events.find((event) => event.event === 'DeployedWithData').args[0];
    console.log("MultiswapForge deployed to:", forgeAddress);

    // Verification (if needed)
    // Note: Verification might need adjustment based on your setup and network
    console.log("Verifying...");
    await hre.run("verify:verify", {
        address: forgeAddress,
        constructorArguments: [],
    });
    console.log("Contract verified successfully !");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

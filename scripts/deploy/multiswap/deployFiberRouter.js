const { ethers } = require("hardhat");

async function main() {
    // Compile the contracts and libraries
    await hre.run('compile');

    // Deploy the OneInchDecoder library
    const OneInchDecoder = await ethers.getContractFactory("OneInchDecoder");
    const oneInchDecoder = await OneInchDecoder.deploy();
    await oneInchDecoder.deployed();
    console.log("OneInchDecoder library deployed to:", oneInchDecoder.address);
    console.log("Verifing...");
    await hre.run("verify:verify", {
      address: oneInchDecoder.address,
      constructorArguments: [],
    });

    // Attach to the already deployed FerrumDeployer contract
    const ferrumDeployerAddress = "0x-ferrumDeployerAddress";
    const FerrumDeployer = await ethers.getContractFactory("FerrumDeployer");
    const ferrumDeployer = await FerrumDeployer.attach(ferrumDeployerAddress);

    // Prepare the initialization data for FiberRouter
    const initData = ethers.utils.defaultAbiCoder.encode(
      ["address", "address", "address"],
      ["0x WETH", "0x-oneInchAggregator", "0x-poolAddress"]   // Replace these addresses with real data 
  );

    // Get the contract factory for FiberRouter, linking the OneInchDecoder library
    const FiberRouter = await ethers.getContractFactory("FiberRouter", {
        libraries: {
            "contracts/common/oneInch/OneInchDecoder.sol:OneInchDecoder": oneInchDecoder.address
        }
    });

    // Compute the bytecode of FiberRouter with initData
    const bytecodeWithInitData = FiberRouter.bytecode + initData.slice(2);

    // Compute a unique salt for deployment
    const salt = ethers.utils.formatBytes32String(new Date().getTime().toString());

    // Deploy FiberRouter using FerrumDeployer's deployOwnable function
    const ownerAddress = "0x-ownerAdddress"; // Replace with the desired owner address
    const deploymentTx = await ferrumDeployer.deployOwnable(salt, ownerAddress, initData, bytecodeWithInitData);
    const receipt = await deploymentTx.wait();

    const fiberRouterAddress = receipt.events.find((event) => event.event === 'DeployedWithData').args[0];
    console.log("FiberRouter deployed to:", fiberRouterAddress);
    console.log("Verifing...");
    await hre.run("verify:verify", {
      address: fiberRouterAddress,
      constructorArguments: [],
      libraries: {
        OneInchDecoder : oneInchDecoder.address,
      },
    });
    console.log("Contract verified successfully !");
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});







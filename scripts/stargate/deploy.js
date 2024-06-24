// scripts/deploy.js
async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    const FundManagerStg = await ethers.getContractFactory("FundManagerStg");
    // // Arbitrum 
    // // Arbitrum Endpoint : 30110
    const stargate = "0xe8CDF27AcD73a434D661C84887215F7598e7d0d3"; 
    const usdc = "0xaf88d065e77c8cc2239327c5edb3a432268e5831"; 
    const endpoint = "0x1a44076050125825900e736c501f859c50fE728c";
    // // Avalanche 
    // // Avalache Endpoint: 30106
    // // Avalanche chain ID: 43114
    // const stargate = "0x5634c4a5FEd09819E3c46D86A965Dd9447d86e47"; 
    // const usdc = "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e"; 
    // const endpoint = "0x1a44076050125825900e736c501f859c50fE728c";

    // const contract = await FundManagerStg.deploy(stargate, usdc, endpoint);
    // console.log("StargateContract deployed to:", contract.address);
    await verifyContract("0x1694371a243b577286ae49b1cd72baa2909fdd18", stargate, usdc, endpoint);
}

async function verifyContract(contractAddress, stargate, usdc, endpoint) {
try {
    console.log(`Verifying contract at address: ${contractAddress}`);

    // Use etherscan verification API
    await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [stargate, usdc, endpoint]
    });

    console.log("Contract verified on etherscan!");
} catch (error) {
    console.error("Error verifying contract:", error);
}
}



main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

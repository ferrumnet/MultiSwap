import { ContractTransactionResponse } from "ethers"
import addresses from "../constants/addresses.json"
import hre from "hardhat"


export const multiswap = async function (
    // Default values. Should only take the passed in value in unit tests
    foundry = addresses.networks[hre.network.name].foundry,
    weth = addresses.networks[hre.network.name].weth,
) {
    const thisNetwork = hre.network.name
    console.log(`Deploying on network: ${thisNetwork}`)
    const salt = "0x3137313032363838383636353800000000000000000000000000000000000000"
    let contractInstances = {}

    // Deploy FerrumDeployer
    const signer = await hre.ethers.getSigners()
    const ferrumDeployer = await hre.ethers.deployContract("FerrumDeployer")

    const factory = await hre.ethers.getContractFactory("FiberRouter")
    const tx = await ferrumDeployer.deployOwnable(salt, signer[0].address, "0x", factory.bytecode)
    const receipt = await tx.wait()
    const address = (receipt.logs[0].address)
    contractInstances["FundManager"] = new hre.ethers.Contract(address, factory.interface, signer[0])

    const fundManager = contractInstances['FundManager']
    const fiberRouter = contractInstances['FiberRouter']

    console.log("\n##### Contract Addresses #####")
    console.log("FundManager:\t\t", fundManager.target)
    // console.log("FiberRouter:\t\t", fiberRouter.target)
}

const sendTx = async (txResponse: Promise<ContractTransactionResponse>, successMessage?: string) => {
    const receipt = await (await txResponse).wait()
    if (receipt?.status == 1) {
        successMessage ? console.log(successMessage) : null
    } else {
        console.error("Transaction failed: " + receipt);
    }
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

multiswap().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});

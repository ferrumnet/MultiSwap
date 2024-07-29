import { ContractTransactionResponse } from "ethers"
import addresses from "../constants/addresses.json"
import hre from "hardhat"
import fundManagerArtifact from "../artifacts/contracts/multiswap-contracts/FundManager.sol/FundManager.json"


export const allowStgTargets = async function (
) {
    const thisNetwork = hre.network.name
    const signer = await hre.ethers.getSigners()

    const fundManagerAddress = addresses.networks[thisNetwork].deployments.fundManager
    const fundManager = new hre.ethers.Contract(fundManagerAddress, fundManagerArtifact.abi, signer[0])
    
    // Allow stargate for other networks
    console.log("\n##### Allowing stgTargetNetworks to other networks #####")
    let otherNetworksStg = Object.keys(addresses.networks).filter((network) =>
        network !== thisNetwork &&
        network !== "hardhat" &&
        network !== "localhost"
    );
        
    for (const otherNetwork of otherNetworksStg) {
        const stgNetworks = Object.keys(addresses.networks).filter((otherNetwork) =>
            addresses.networks[otherNetwork].stg !== undefined
        );
        const isStg = stgNetworks.includes(otherNetwork)
        if (isStg) {     
            await sendTx(fundManager.setStgTargetNetwork(
                addresses.networks[otherNetwork].chainId,
                addresses.networks[otherNetwork].stg.stgEndpointID,
                addresses.networks[otherNetwork].deployments.fundManager),
                `StargateTargetNetwork for chainId ${otherNetwork} successful`
            );
        }
    }
}

const sendTx = async (txResponse: Promise<ContractTransactionResponse>, successMessage?: string) => {
    const receipt = await (await txResponse).wait()
    await delay(100)
    if (receipt?.status == 1) {
        successMessage ? console.log(successMessage) : null
    } else {
        console.error("Transaction failed: " + receipt);
    }
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

allowStgTargets().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});
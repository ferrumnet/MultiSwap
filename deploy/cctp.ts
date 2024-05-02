import { ContractTransactionResponse } from "ethers"
import addresses from "../constants/addresses.json"
import hre from "hardhat"


export const multiswap = async function () {
    const thisNetwork = hre.network.name
    console.log(`Setting up CCTP on network: ${thisNetwork}`)
    

    
}

const sendTx = async (txResponse: Promise<ContractTransactionResponse>, successMessage?: string) => {
    const receipt = await (await txResponse).wait()
    if (receipt?.status == 1) {
        successMessage ? console.log(successMessage) : null
    } else {
        console.error("Transaction failed: " + receipt);
    }
}

multiswap().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});

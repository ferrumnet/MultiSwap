import { ContractTransactionResponse, MaxUint256 } from "ethers"
import { ethers } from "ethers"
import addresses from "../../constants/addresses.json"
import hre from "hardhat"
import usdcAbi from "../abis/Usdc.json"


const testZkSync = async function () {    
    const wallet = new ethers.Wallet("0x" + process.env.PRIVATE_KEY0)
    const provider = new ethers.JsonRpcProvider("https://mainnet.era.zksync.io")
    const signer = wallet.connect(provider)
    
    const usdcAddress = "0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4"
    const usdc = new ethers.Contract(usdcAddress, usdcAbi, signer)

    console.log(await usdc.balanceOf(signer.address))
}

const sendTx = async (txResponse: Promise<ContractTransactionResponse>, successMessage?: string) => {
    const receipt = await (await txResponse).wait()
    await delay(3000)
    if (receipt?.status == 1) {
        successMessage ? console.log(successMessage) : null
    } else {
        console.error("Transaction failed: " + receipt);
    }
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms))


testZkSync()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
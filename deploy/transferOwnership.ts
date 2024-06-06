import { ContractTransactionResponse } from "ethers"
import addresses from "../constants/addresses.json"
import hre from "hardhat"
import fiberRouterArtifact from "../artifacts/contracts/multiswap-contracts/FiberRouter.sol/FiberRouter.json"
import fundManagerArtifact from "../artifacts/contracts/multiswap-contracts/FundManager.sol/FundManager.json"
import multiswapForgeArtifact from "../artifacts/contracts/multiswap-contracts/MultiSwapForge.sol/MultiSwapForge.json"
import forgeFundManagerArtifact from "../artifacts/contracts/multiswap-contracts/ForgeFundManager.sol/ForgeFundManager.json"
import cctpFundManagerArtifact from "../artifacts/contracts/multiswap-contracts/CCTPFundManager.sol/CCTPFundManager.json"
import forgeCctpFundManagerArtifact from "../artifacts/contracts/multiswap-contracts/ForgeCCTPFundManager.sol/ForgeCCTPFundManager.json"


export const transferOwnership = async function () {
    const thisNetwork = hre.network.name

    const cctpNetworks = Object.keys(addresses.networks).filter((network) =>
        addresses.networks[network].cctp !== undefined
    );

    // Initiate contract instance
    const signer = await hre.ethers.getSigners()
    const fiberRouter = new hre.ethers.Contract(addresses.networks[thisNetwork].deployments.fiberRouter, fiberRouterArtifact.abi, signer[0])
    const fundManager = new hre.ethers.Contract(addresses.networks[thisNetwork].deployments.fundManager, fundManagerArtifact.abi, signer[0])
    const multiswapForge = new hre.ethers.Contract(addresses.networks[thisNetwork].deployments.multiSwapForge, multiswapForgeArtifact.abi, signer[0])
    const forgeFundManager = new hre.ethers.Contract(addresses.networks[thisNetwork].deployments.forgeFundManager, forgeFundManagerArtifact.abi, signer[0])
    
    await sendTx(fiberRouter.transferOwnership(addresses.prodWallet), `Ownership of FiberRouter transferred to ${addresses.prodWallet}`)
    await sendTx(fundManager.transferOwnership(addresses.prodWallet), `Ownership of FundManager transferred to ${addresses.prodWallet}`)
    await sendTx(multiswapForge.transferOwnership(addresses.prodWallet), `Ownership of MultiSwapForge transferred to ${addresses.prodWallet}`)
    await sendTx(forgeFundManager.transferOwnership(addresses.prodWallet), `Ownership of ForgeFundManager transferred to ${addresses.prodWallet}`)
    if (cctpNetworks.includes(thisNetwork)) {
        const cctpFundManager = new hre.ethers.Contract(addresses.networks[thisNetwork].deployments.cctpFundManager, cctpFundManagerArtifact.abi, signer[0])
        const forgeCctpFundManager = new hre.ethers.Contract(addresses.networks[thisNetwork].deployments.forgeCCTPFundManager, forgeCctpFundManagerArtifact.abi, signer[0])

        await sendTx(cctpFundManager.transferOwnership(addresses.prodWallet), `Ownership of CCTPFundManager transferred to ${addresses.prodWallet}`)
        await sendTx(forgeCctpFundManager.transferOwnership(addresses.prodWallet), `Ownership of ForgeCCTPFundManager transferred to ${addresses.prodWallet}`)
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

transferOwnership()
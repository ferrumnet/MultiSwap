import { ContractTransactionResponse, MaxUint256 } from "ethers"
import addresses from "../../constants/addresses.json"
import hre from "hardhat"
import fundManagerArtifact from "../../artifacts/contracts/multiswap-contracts/FundManager.sol/FundManager.json"
import forgeFundManagerArtifact from "../../artifacts/contracts/multiswap-contracts/ForgeFundManager.sol/ForgeFundManager.json"
import multiswapForgeArtifact from "../../artifacts/contracts/multiswap-contracts/MultiSwapForge.sol/MultiSwapForge.json"
import fiberRouterArtifact from "../../artifacts/contracts/multiswap-contracts/FiberRouter.sol/FiberRouter.json"

import usdcAbi from "../abis/Usdc.json"


const addLiquidity = async function () {
    const thisNetwork = hre.network.name
    const foundry = addresses.networks[thisNetwork].foundry
    
    const signer = await hre.ethers.getSigners()

    // FiberRouter:     0xbB1886FA834917716049094090387DEa0680BFFc
    // FundManager:     0xB4A5D95BFEC6AFd359e05aA982718C11bF04a7Ff
    // MultiSwapForge:     0x065b063aB44D26B51321dAb28b71D2290B43dDc4
    // ForgeFundManager:     0xc7F2c8472f4cCE8a11373203B5B55586CB030928
    // CCTPFundManager:     0xa1F125c53c08B36659ebBA4faAb8046a82cF5C21

    const fundManagerAddress = "0xB4A5D95BFEC6AFd359e05aA982718C11bF04a7Ff"
    const forgeFundManagerAddress = "0xc7F2c8472f4cCE8a11373203B5B55586CB030928"
    const multiswapForgeAddress = "0x065b063aB44D26B51321dAb28b71D2290B43dDc4"
    const fiberRouterAddress = "0xbB1886FA834917716049094090387DEa0680BFFc"

    const fundManager = new hre.ethers.Contract(fundManagerAddress, fundManagerArtifact.abi, signer[0])
    const forgeManager = new hre.ethers.Contract(forgeFundManagerAddress, forgeFundManagerArtifact.abi, signer[0])
    const multiswapForge = new hre.ethers.Contract(multiswapForgeAddress, multiswapForgeArtifact.abi, signer[0])
    const fiberRouter = new hre.ethers.Contract(fiberRouterAddress, fiberRouterArtifact.abi, signer[0])
    const usdc = new hre.ethers.Contract(foundry, usdcAbi, signer[0])

    // console.log("\n##### FundManager configs #####")
    // await sendTx(fundManager.addFoundryAsset(foundry), "setFoundry successful")
    // await sendTx(fundManager.setLiquidityManagers(signer[0], addresses.liquidityManagerBot), "setLiquidityManagers successful")
    // await sendTx(usdc.approve(fundManager, MaxUint256), "Approve successful")
    // await sendTx(fundManager.addLiquidityByManager(foundry, BigInt("5000000")), "addLiquidity successful")

    // console.log("\n##### ForgeFundManager configs #####")
    // await sendTx(forgeManager.addFoundryAsset(foundry), "setFoundry successful")
    // await sendTx(forgeManager.setLiquidityManagers(signer[0], addresses.liquidityManagerBot), "setLiquidityManagers successful")
    // await sendTx(usdc.approve(forgeManager, MaxUint256), "Approve successful")
    // await sendTx(forgeManager.addLiquidityByManager(foundry, BigInt("1000000")), "addLiquidity successful")

    // console.log("\n##### Allowing targets to other networks #####")
    // let otherNetworks = Object.keys(addresses.networks).filter((network) => network !== thisNetwork && network !== "hardhat" && network !== "localhost");
    // for (const otherNetwork of otherNetworks) {
    //     await sendTx(fundManager.allowTarget(
    //         foundry,
    //         addresses.networks[otherNetwork].chainId,
    //         addresses.networks[otherNetwork].foundry),
    //         `allowTarget to chainId ${addresses.networks[otherNetwork].chainId} successful`
    //     );
    // }

    await sendTx(multiswapForge.setGasEstimationAddress(addresses.gasEstimationWallet), "setGasEstimationAddress successful")
    // await sendTx(fiberRouter.addSiger(signer[0].address), "addSigner successful")
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


addLiquidity()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
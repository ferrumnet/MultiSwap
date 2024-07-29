import { ContractTransactionResponse } from "ethers"
import addresses from "../constants/addresses.json"
import * as fs from 'fs';
import path from 'path';
import hre from "hardhat"
import fiberRouterArtifact from "../artifacts/contracts/multiswap-contracts/FiberRouter.sol/FiberRouter.json"
import fundManagerArtifact from "../artifacts/contracts/multiswap-contracts/FundManager.sol/FundManager.json"
import cctpFundManagerArtifact from "../artifacts/contracts/multiswap-contracts/CCTPFundManager.sol/CCTPFundManager.json"
import multiswapForgeArtifact from "../artifacts/contracts/multiswap-contracts/MultiSwapForge.sol/MultiSwapForge.json"
import forgeFundManagerArtifact from "../artifacts/contracts/multiswap-contracts/ForgeFundManager.sol/ForgeFundManager.json"
import forgeCctpFundManagerArtifact from "../artifacts/contracts/multiswap-contracts/ForgeCCTPFundManager.sol/ForgeCCTPFundManager.json"


export const multiswap = async function (
    // Default values. Should only take the passed in value in unit tests
    foundry = addresses.networks[hre.network.name].foundry,
    weth = addresses.networks[hre.network.name].weth,
) {
    const thisNetwork = hre.network.name
    const cctpNetworks = Object.keys(addresses.networks).filter((network) =>
        addresses.networks[network].cctp !== undefined
    );
    const isCctp = cctpNetworks.includes(thisNetwork)

    const stgNetworks = Object.keys(addresses.networks).filter((network) =>
        addresses.networks[network].stg !== undefined
    );
    const isStg = stgNetworks.includes(thisNetwork)

    console.log(`Deploying on network: ${thisNetwork}`)
    
    // Deploy FerrumDeployer
    const signer = await hre.ethers.getSigners()
    
    // Deploy contracts
    let contractInstances = {}
    const contractNames =  ["FiberRouter", "FundManager", "MultiSwapForge", "ForgeFundManager", "CCTPFundManager", "ForgeCCTPFundManager"]

    for (const contractName of contractNames) {
        if (!isCctp && (contractName === "CCTPFundManager" || contractName === "ForgeCCTPFundManager")) {
            continue
        }
        
        console.log(`Deploying ${contractName}`)
        const factory = await hre.ethers.getContractFactory(contractName)
        const contract = await factory.deploy();

        contractInstances[contractName] = contract
    }

    const fiberRouter = contractInstances['FiberRouter']
    const fundManager = contractInstances['FundManager']
    const multiswapForge = contractInstances['MultiSwapForge']
    const forgeManager = contractInstances['ForgeFundManager']
    const cctpFundManager = contractInstances['CCTPFundManager']
    const forgeCctpFundManager = contractInstances['ForgeCCTPFundManager']

    addresses.networks[thisNetwork].deployments.fiberRouter = fiberRouter.target
    addresses.networks[thisNetwork].deployments.fundManager = fundManager.target
    addresses.networks[thisNetwork].deployments.multiSwapForge = multiswapForge.target
    addresses.networks[thisNetwork].deployments.forgeFundManager = forgeManager.target
    if (isCctp) {
        addresses.networks[thisNetwork].deployments.cctpFundManager = cctpFundManager.target
        addresses.networks[thisNetwork].deployments.forgeCCTPFundManager = forgeCctpFundManager.target
    }

    // const fiberRouterAddress = addresses.networks[thisNetwork].deployments.fiberRouter
    // const fundManagerAddress = addresses.networks[thisNetwork].deployments.fundManager
    // const multiswapForgeAddress = addresses.networks[thisNetwork].deployments.multiSwapForge
    // const forgeFundManagerAddress = addresses.networks[thisNetwork].deployments.forgeFundManager
    // const cctpFundManagerAddress = addresses.networks[thisNetwork].deployments.cctpFundManager
    // const forgeCctpFundManagerAddress = addresses.networks[thisNetwork].deployments.forgeCCTPFundManager

    // const fiberRouter = new hre.ethers.Contract(fiberRouterAddress, fiberRouterArtifact.abi, signer[0])
    // const fundManager = new hre.ethers.Contract(fundManagerAddress, fundManagerArtifact.abi, signer[0])
    // const multiswapForge = new hre.ethers.Contract(multiswapForgeAddress, multiswapForgeArtifact.abi, signer[0])
    // const forgeManager = new hre.ethers.Contract(forgeFundManagerAddress, forgeFundManagerArtifact.abi, signer[0])
    // const cctpFundManager = new hre.ethers.Contract(cctpFundManagerAddress, cctpFundManagerArtifact.abi, signer[0])
    // const forgeCctpFundManager = new hre.ethers.Contract(forgeCctpFundManagerAddress, forgeCctpFundManagerArtifact.abi, signer[0])

    const filePath = path.join(__dirname, '../constants/addresses.json');
    writeJsonToFile(filePath, addresses);

    // Post deploy configs
    console.log("\n##### FiberRouter configs #####")
    await sendTx(fiberRouter.setWeth(weth), "setWeth successful")
    await sendTx(fiberRouter.setFundManager(addresses.networks[thisNetwork].deployments.fundManager), "setPool successful")
    await sendTx(fiberRouter.addSigner(addresses.signer), "setSignerWallet successful")
    await sendTx(fiberRouter.setFeeWallet(addresses.feeWallet), "setFeeWallet successful")
    await sendTx(fiberRouter.setPlatformFee(addresses.platformFee), "setPlatformFee successful")
    await sendTx(fiberRouter.setGasWallet(addresses.gasWallet), "setGasWallet successful")
    
    console.log("\n##### FundManager configs #####")
    await sendTx(fundManager.setRouter(addresses.networks[thisNetwork].deployments.fiberRouter), "setRouter successful")
    await sendTx(fundManager.addFoundryAsset(foundry), "addFoundryAsset successful")
    await sendTx(fundManager.addSigner(addresses.signer), "setSignerWallet successful")
    await sendTx(fundManager.setLiquidityManagers(addresses.liquidityManager, addresses.liquidityManagerBot), "setLiquidityManagers successful")
    await sendTx(fundManager.setWithdrawalAddress(addresses.withdrawal), "setWithdrawalAddress successful")
    await sendTx(fundManager.setSettlementManager(addresses.settlementManager), "setSettlementManager successful")
    if (isStg) {
        await sendTx(fundManager.initConfig(addresses.networks[thisNetwork].stg.stgUSDCPool, foundry, addresses.networks[thisNetwork].stg.stgEndpoint), "initConfig successful")
    }

    console.log("\n##### MultiSwapForge configs #####")
    await sendTx(multiswapForge.setWeth(weth), "setWeth successful")
    await sendTx(multiswapForge.setFundManager(forgeManager), "setPool successful")
    await sendTx(multiswapForge.setGasEstimationAddress(addresses.gasEstimationWallet), "setGasEstimationAddress successful")

    console.log("\n##### ForgeFundManager configs #####")
    await sendTx(forgeManager.setRouter(multiswapForge), "setRouter successful")
    await sendTx(forgeManager.addFoundryAsset(foundry), "addFoundryAsset successful")

    // Add routers and selectors. Selectors need to be computed with scripts/computeSelectors.ts and added to constants/addresses.json beforehand
    console.log("\n##### Adding routers and selectors #####")
    const swapRouters = addresses.networks[thisNetwork].routers
    for (const swapRouter of swapRouters) {
        console.log(`For router: ${swapRouter.router}`)
        const router = swapRouter.router
        const selectors = swapRouter.selectors
        await sendTx(fiberRouter.addRouterAndSelectors(router, selectors), "addRouterAndSelectors successful")
        await sendTx(multiswapForge.addRouterAndSelectors(router, selectors), "addRouterAndSelectors successful")
    }

    // Allow targets for other networks
    console.log("\n##### Allowing targets to other networks #####")
    let otherNetworksX = Object.keys(addresses.networks).filter((network) =>
        network !== thisNetwork &&
        network !== "hardhat" &&
        network !== "localhost"
    );
    
    for (const otherNetwork of otherNetworksX) {
        await sendTx(fundManager.allowTarget(
            foundry,
            addresses.networks[otherNetwork].chainId,
            addresses.networks[otherNetwork].foundry),
            `allowTarget to chainId ${addresses.networks[otherNetwork].chainId} successful`
        );
    }

    // CCTP Setup
    if (isCctp) {
        console.log("\n##### CCTPFundManager configs #####")

        // FiberRouter
        await sendTx(fiberRouter.setCCTPFundManager(cctpFundManager), "setCCTPManager successful")
        
        // CCTPFundManager
        await sendTx(cctpFundManager.initCCTP(addresses.networks[thisNetwork].cctp.tokenMessenger, foundry, cctpFundManager), "initCCTP successful")
        await sendTx(cctpFundManager.setRouter(fiberRouter), "setRouter successful")
        await sendTx(cctpFundManager.addSigner(addresses.signer), "addSigner successful")

        // MultiSwapForge
        await sendTx(multiswapForge.setCCTPFundManager(forgeCctpFundManager), "setCCTPManager successful")
        
        // ForgeCCTPFundManager
        await sendTx(forgeCctpFundManager.initCCTP(addresses.networks[thisNetwork].cctp.tokenMessenger, foundry, forgeCctpFundManager), "forge initCCTP successful")
        await sendTx(forgeCctpFundManager.setRouter(multiswapForge), "setRouter successful")
        await sendTx(forgeCctpFundManager.addSigner(addresses.signer), "addSigner successful")
    }

    console.log("\n##### Contract Addresses #####")
    console.log("FiberRouter:\t\t", fiberRouter.target)
    console.log("FundManager:\t\t", fundManager.target)
    console.log("MultiSwapForge:\t\t", multiswapForge.target)
    console.log("ForgeFundManager:\t", forgeManager.target)
    if(isCctp) {
        console.log("CCPTFundManager:\t", cctpFundManager.target)
        console.log("ForgeCCTPFundManager:\t", forgeCctpFundManager.target)
    }

    return { fiberRouter, fundManager, multiswapForge, forgeManager, cctpFundManager, forgeCctpFundManager }
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

const writeJsonToFile = (filePath: string, data: object) => {
    const dataStr = JSON.stringify(data, null, 4); // Converts JSON object to string with pretty print
    fs.writeFileSync(filePath, dataStr, 'utf8'); // Synchronously write file
}

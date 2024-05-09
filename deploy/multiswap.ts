import { ContractTransactionResponse } from "ethers"
import addresses from "../constants/addresses.json"
import hre from "hardhat"
import fiberRouterArtifact from "../artifacts/contracts/multiswap-contracts/FiberRouter.sol/FiberRouter.json"
import fundManagerArtifact from "../artifacts/contracts/multiswap-contracts/FundManager.sol/FundManager.json"
import multiswapForgeArtifact from "../artifacts/contracts/multiswap-contracts/MultiSwapForge.sol/MultiSwapForge.json"
import forgeFundManagerArtifact from "../artifacts/contracts/multiswap-contracts/ForgeFundManager.sol/ForgeFundManager.json"
import usdcAbi from "../scripts/abis/Usdc.json"


export const multiswap = async function (
    // Default values. Should only take the passed in value in unit tests
    foundry = addresses.networks[hre.network.name].foundry,
    weth = addresses.networks[hre.network.name].weth,
) {
    const thisNetwork = hre.network.name
    const cctpNetworks = Object.keys(addresses.networks).filter((network) =>
        addresses.networks[network].cctp !== undefined
    );

    console.log(`Deploying on network: ${thisNetwork}`)
    const salt = "0x3137313032363838383636353800000000000000000000000000000000000000"
    let contractInstances = {}

    // Deploy FerrumDeployer
    const signer = await hre.ethers.getSigners()
    const ferrumDeployer = await (await hre.ethers.deployContract("FerrumDeployer")).waitForDeployment()

    // Deploy contracts
    const contracts = ["FiberRouter", "FundManager", "MultiSwapForge", "CCTPFundManager", "ForgeFundManager"]
    for (const contract of contracts) {
        if (contract === "CCTPFundManager" && !cctpNetworks.includes(thisNetwork)) {
            continue
        }
        console.log(`Deploying ${contract}`)
        const factory = await hre.ethers.getContractFactory(contract)
        const tx = await ferrumDeployer.deployOwnable(salt, signer[0].address, "0x", factory.bytecode)
        const receipt = await tx.wait()
        const address = (receipt.logs[0].address)
        contractInstances[contract] = new hre.ethers.Contract(address, factory.interface, signer[0])
    }

    const fiberRouter = contractInstances['FiberRouter']
    const fundManager = contractInstances['FundManager']
    const multiswapForge = contractInstances['MultiSwapForge']
    const forgeManager = contractInstances['ForgeFundManager']
    const cctpFundManager = contractInstances['CCTPFundManager']

    // const fundManagerAddress = "0x089DD5F8c7d3d59E6E88e3AEde61825589206f24"
    // const fiberRouterAddress = "0xa071f481B56d6d137eE851C44D703A0d0BE8d353"
    // const multiswapForgeAddress = "0x7Ec6ac6Ec1aA2caCbe7da122CFff15206c5bC8bF"
    // const forgeFundManagerAddress = "0x1738710f51b56ca23A8DBC800044Bd0404FFA5d9"

    // const fiberRouter = new hre.ethers.Contract(fiberRouterAddress, fiberRouterArtifact.abi, signer[0])
    // const fundManager = new hre.ethers.Contract(fundManagerAddress, fundManagerArtifact.abi, signer[0])
    // const multiswapForge = new hre.ethers.Contract(multiswapForgeAddress, multiswapForgeArtifact.abi, signer[0])
    // const forgeManager = new hre.ethers.Contract(forgeFundManagerAddress, forgeFundManagerArtifact.abi, signer[0])
    
    const usdc = new hre.ethers.Contract(foundry, usdcAbi, signer[0])

    // Post deploy configs
    console.log("\n##### FiberRouter configs #####")
    await sendTx(fiberRouter.setWeth(weth), "setWeth successful")
    await sendTx(fiberRouter.setPool(fundManager), "setPool successful")
    await sendTx(fiberRouter.setGasWallet(addresses.gasWallet), "setGasWallet successful")
    
    console.log("\n##### FundManager configs #####")
    await sendTx(fundManager.setRouter(fiberRouter), "setRouter successful")
    await sendTx(fundManager.addFoundryAsset(foundry), "addFoundryAsset successful")
    await sendTx(fundManager.addSigner(addresses.signer), "addSigner successful")
    await sendTx(fundManager.setLiquidityManagers(signer[0], addresses.liquidityManagerBot), "setLiquidityManagers successful")
    await sendTx(fundManager.setWithdrawalAddress(addresses.withdrawal), "setWithdrawalAddress successful")
    await sendTx(fundManager.setSettlementManager(addresses.settlementManager), "setSettlementManager successful")
    console.log(signer[0].address)
    // console.log("USDC balance: ", await usdc.balanceOf(signer[0]))
    await sendTx(usdc.approve(fundManager.target, "3000000"), "Approval successful")
    // await sendTx(fundManager.addLiquidityByManager(foundry, "3000000"), "addLiquidityByManager successful")

    console.log("\n##### CCTPFundManager configs #####")
    await sendTx(cctpFundManager.setRouter(fiberRouter), "setRouter successful")
    await sendTx(cctpFundManager.addSigner(addresses.signer), "addSigner successful")
    await sendTx(usdc.approve(cctpFundManager.target, "1000000"), "Approval successful")

    console.log("\n##### MultiSwapForge configs #####")
    await sendTx(multiswapForge.setWeth(weth), "setWeth successful")
    await sendTx(multiswapForge.setPool(forgeManager), "setPool successful")
    await sendTx(multiswapForge.setGasEstimationAddress(addresses.gasEstimationWallet), "setGasEstimationAddress successful")

    console.log("\n##### ForgeFundManager configs #####")
    await sendTx(forgeManager.setRouter(multiswapForge), "setRouter successful")
    await sendTx(forgeManager.addFoundryAsset(foundry), "addFoundryAsset successful")
    await sendTx(usdc.approve(forgeManager.target, "1000000"), "Approval successful")
    // await sendTx(forgeManager.addLiquidityByManager(foundry, "1000000"), "addLiquidityByManager successful")

    // Add routers and selectors. Selectors need to be computed with scripts/computeSelectors.ts and added to constants/addresses.json beforehand
    console.log("\n##### Adding routers and selectors #####")
    const swapRouters = addresses.networks[thisNetwork].routers
    for (const swapRouter of swapRouters) {
        console.log(`For router: ${swapRouter.router}`)
        const router = swapRouter.router
        const selectors = swapRouter.selectors
        for (const selector of selectors) {
            console.log(`\tAdding selector: ${selector}`)
            await sendTx(fiberRouter.addRouterAndSelector(router, selector))
            await sendTx(multiswapForge.addRouterAndSelector(router, selector))
        }
    }

    // Allow targets for other networks
    console.log("\n##### Allowing targets to other networks #####")
    let otherNetworks = Object.keys(addresses.networks).filter((network) =>
        network !== thisNetwork &&
        network !== "hardhat" &&
        network !== "localhost"
    );
    for (const otherNetwork of otherNetworks) {
        await sendTx(fundManager.allowTarget(
            foundry,
            addresses.networks[otherNetwork].chainId,
            addresses.networks[otherNetwork].foundry),
            `allowTarget to chainId ${addresses.networks[otherNetwork].chainId} successful`
        );
    }

    // CCTP Setup
    if (cctpNetworks.includes(thisNetwork)) {
        await sendTx(fiberRouter.initCCTP(
            addresses.networks[thisNetwork].cctp.tokenMessenger,
            foundry,
            cctpFundManager
        ),
            "initCCTP successful"
        )
    }

    console.log("\n##### Contract Addresses #####")
    console.log("FiberRouter:\t\t", fiberRouter.target)
    console.log("FundManager:\t\t", fundManager.target)
    console.log("CCPTFundManager:\t", cctpFundManager.target)
    console.log("MultiSwapForge:\t\t", multiswapForge.target)
    console.log("ForgeFundManager:\t", forgeManager.target)

    return { fiberRouter, fundManager, cctpFundManager, multiswapForge, forgeManager }
}

const sendTx = async (txResponse: Promise<ContractTransactionResponse>, successMessage?: string) => {
    const receipt = await (await txResponse).wait()
    await delay(200)
    if (receipt?.status == 1) {
        successMessage ? console.log(successMessage) : null
    } else {
        console.error("Transaction failed: " + receipt);
    }
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

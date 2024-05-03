import { exec } from "child_process"
import { ContractTransactionResponse, MaxUint256 } from "ethers"
import addresses from "../constants/addresses.json"
import hre from "hardhat"
import fiberRouterArtifact from "../artifacts/contracts/multiswap-contracts/FiberRouter.sol/FiberRouter.json"
import fundManagerArtifact from "../artifacts/contracts/multiswap-contracts/FundManager.sol/FundManager.json"
import multiswapForgeArtifact from "../artifacts/contracts/multiswap-contracts/MultiSwapForge.sol/MultiSwapForge.json"
import forgeFundManagerArtifact from "../artifacts/contracts/multiswap-contracts/ForgeFundManager.sol/ForgeFundManager.json"
import usdcAbi from "../scripts/abis/Usdc.json"

const thisNetwork = hre.network.name

export const multiswap = async function (
    // Default values. Should only take the passed in value in unit tests
    foundry = addresses.networks[thisNetwork].foundry,
    weth = addresses.networks[thisNetwork].weth,
) {
    
    console.log(`Deploying on network: ${thisNetwork}`)
    const salt = "0x3137313032363838383636353800000000000000000000000000000000000000"
    let contractInstances = {}

    // Deploy FerrumDeployer
    const signer = await hre.ethers.getSigners()
    const ferrumDeployer = await (await hre.ethers.deployContract("FerrumDeployer")).waitForDeployment()

    // Deploy contracts
    const contracts = ["FundManager", "FiberRouter", "MultiSwapForge", "ForgeFundManager"]
    for (const contract of contracts) {
        console.log(`Deploying ${contract}`)
        const factory = await hre.ethers.getContractFactory(contract)
        const tx = await ferrumDeployer.deployOwnable(salt, signer[0].address, "0x", factory.bytecode)
        const receipt = await tx.wait()
        const address = (receipt.logs[0].address)
        console.log("Address: "+ address)
        contractInstances[contract] = new hre.ethers.Contract(address, factory.interface, signer[0])
    }
    const fundManager = contractInstances['FundManager']
    const fiberRouter = contractInstances['FiberRouter']
    const multiswapForge = contractInstances['MultiSwapForge']
    const forgeManager = contractInstances['ForgeFundManager']

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

    let amount = "5000000"
    await sendTx(usdc.approve(fundManager, MaxUint256), "Approve successful")
    await sendTx(fundManager.addLiquidityByManager(foundry, BigInt(amount)), "addLiquidity successful")

    console.log("\n##### MultiSwapForge configs #####")
    await sendTx(multiswapForge.setWeth(weth), "setWeth successful")
    await sendTx(multiswapForge.setPool(forgeManager), "setPool successful")
    await sendTx(multiswapForge.setGasEstimationAddress(addresses.gasEstimationWallet), "setGasEstimationAddress successful")

    console.log("\n##### ForgeFundManager configs #####")
    await sendTx(forgeManager.setRouter(multiswapForge), "setRouter successful")
    await sendTx(forgeManager.addFoundryAsset(foundry), "addFoundryAsset successful")

    amount = "1000000"
    await sendTx(forgeManager.setLiquidityManagers(signer[0], addresses.liquidityManagerBot), "setLiquidityManagers successful")
    await sendTx(usdc.approve(forgeManager, MaxUint256), "Approve successful")
    await sendTx(forgeManager.addLiquidityByManager(usdc, BigInt(amount)), "addLiquidity successful")

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
    let otherNetworks = Object.keys(addresses.networks).filter((network) => network !== thisNetwork && network !== "hardhat" && network !== "localhost");
    for (const otherNetwork of otherNetworks) {
        await sendTx(fundManager.allowTarget(
            foundry,
            addresses.networks[otherNetwork].chainId,
            addresses.networks[otherNetwork].foundry),
            `allowTarget to chainId ${addresses.networks[otherNetwork].chainId} successful`
        );
    }

    console.log("\n##### Contract Addresses #####")
    console.log("FiberRouter:\t\t", fiberRouter.target)
    console.log("FundManager:\t\t", fundManager.target)
    console.log("MultiSwapForge:\t\t", multiswapForge.target)
    console.log("ForgeFundManager:\t", forgeManager.target)

    await hre.run("verify:verify", {
        address: fiberRouter.target,
        constructorArguments: [],
    });

    await hre.run("verify:verify", {
        address: multiswapForge.target,
        constructorArguments: [],
    });

    // exec(`hh verify ${fundManager.target} --network arbitrum --contract contracts/multiswap-contracts/FundManager.sol:FundManager`, (err, stdout, stderr) => {
    //     if (err) {
    //         console.error(stderr)
    //         return
    //     }

    //     console.log(stdout)
    // });

    // exec(`hh verify ${forgeManager.target} --network arbitrum --contract contracts/multiswap-contracts/ForgeFundManager.sol:ForgeFundManager`, (err, stdout, stderr) => {
    //     if (err) {
    //         console.error(stderr)
    //         return
    //     }

    //     console.log(stdout)
    // });

    return { fiberRouter, fundManager, multiswapForge, forgeManager }
}

const sendTx = async (txResponse: Promise<ContractTransactionResponse>, successMessage?: string) => {
    const receipt = await (await txResponse).wait()
    await delay(1000)
    if (receipt?.status == 1) {
        successMessage ? console.log(successMessage) : null
    } else {
        console.error("Transaction failed: " + receipt);
    }
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms))
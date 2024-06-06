import { HardhatRuntimeEnvironment, HttpNetworkConfig } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { Provider, Contract } from "zksync-ethers";
import addresses from "../constants/addresses_full.json";
import { MaxUint256 } from "ethers"
import usdcAbi from "../scripts/abis/Usdc.json"
import fiberRouterArtifact from "../artifacts-zk/contracts/multiswap-contracts/FiberRouter.sol/FiberRouter.json"
import fundManagerArtifact from "../artifacts-zk/contracts/multiswap-contracts/FundManager.sol/FundManager.json"
import multiswapForgeArtifact from "../artifacts-zk/contracts/multiswap-contracts/MultiSwapForge.sol/MultiSwapForge.json"
import forgeFundManagerArtifact from "../artifacts-zk/contracts/multiswap-contracts/ForgeFundManager.sol/ForgeFundManager.json"

const deployScript = async function (hre: HardhatRuntimeEnvironment) {
    const provider = new Provider((hre.network.config as HttpNetworkConfig).url)
    const wallet = (await hre.zksyncEthers.getWallet()).connect(provider)
    const thisNetwork = "zksync"

    const weth = addresses.networks.zksync.weth
    const foundry = addresses.networks.zksync.foundry
    const deployer = new Deployer(hre, wallet);
    const usdc = new hre.ethers.Contract(foundry, usdcAbi, deployer.ethWallet.connect(provider))
    
    console.log("USDC Balance: ", (await usdc.balanceOf(deployer.ethWallet)).toString())

    // Deploy contracts
    const fiberRouter = await (await deployContract(hre, "FiberRouter", deployer, [])).waitForDeployment();
    console.log("FiberRouter: " + fiberRouter.target)
    const fundManager = await (await deployContract(hre, "FundManager", deployer, [])).waitForDeployment();
    console.log("FundManager: " + fundManager.target)
    const multiswapForge = await deployContract(hre, "MultiSwapForge", deployer, []);
    console.log("MultiSwapForge: " + multiswapForge.target)
    const forgeManager = await deployContract(hre, "ForgeFundManager", deployer, []);
    console.log("ForgeManager: " + forgeManager.target)
    
    // const fundManagerAddress = "0xE2a9b9bE7Ed933b00c03FFED1e8ec2AB9988b847"
    // const fiberRouterAddress = "0xCdFFF8eEA7f75eDE4609D7Bd23e3B6413A550f9c"
    // const multiswapForgeAddress = "0x3B0eF97C597B73C45D25F27C1d16C9410601AFbE"
    // const forgeFundManagerAddress = "0xfB5B5cF06473a26FB28ac438608911206462cC0f"

    // const fiberRouter = new hre.ethers.Contract(fiberRouterAddress, fiberRouterArtifact.abi, deployer.ethWallet)
    // const fundManager = new hre.ethers.Contract(fundManagerAddress, fundManagerArtifact.abi, deployer.ethWallet)
    // const multiswapForge = new hre.ethers.Contract(multiswapForgeAddress, multiswapForgeArtifact.abi, deployer.ethWallet)
    // const forgeManager = new hre.ethers.Contract(forgeFundManagerAddress, forgeFundManagerArtifact.abi, deployer.ethWallet)

    

    // Post deploy configs
    console.log("\n##### FiberRouter configs #####")
    await sendTx(fiberRouter.setWeth(weth), "setWeth successful")
    await sendTx(fiberRouter.setPool(fundManager), "setPool successful")
    await sendTx(fiberRouter.setGasWallet(addresses.gasWallet), "setGasWallet successful")
    
    console.log("\n##### FundManager configs #####")
    await sendTx(fundManager.setRouter(fiberRouter), "setRouter successful")
    await sendTx(fundManager.addFoundryAsset(foundry), "addFoundryAsset successful")
    await sendTx(fundManager.addSigner(addresses.signer), "addSigner successful")
    await sendTx(fundManager.setLiquidityManagers(deployer.ethWallet, addresses.liquidityManagerBot), "setLiquidityManagers successful")
    await sendTx(fundManager.setWithdrawalAddress(addresses.withdrawal), "setWithdrawalAddress successful")
    await sendTx(fundManager.setSettlementManager(addresses.settlementManager), "setSettlementManager successful")

    let amount = "3000000"
    await sendTx(usdc.approve(fundManager, MaxUint256), "Approve successful")
    // // await sendTx(usdc.approve(fundManager, MaxUint256), "Approve successful")
    await sendTx(fundManager.addLiquidityByManager(foundry, BigInt(amount)), "addLiquidity successful")

    console.log("\n##### MultiSwapForge configs #####")
    await sendTx(multiswapForge.setWeth(weth), "setWeth successful")
    await sendTx(multiswapForge.setPool(forgeManager), "setPool successful")
    await sendTx(multiswapForge.setGasEstimationAddress(addresses.gasEstimationWallet), "setGasEstimationAddress successful")

    console.log("\n##### ForgeFundManager configs #####")
    await sendTx(forgeManager.setRouter(multiswapForge), "setRouter successful")
    await sendTx(forgeManager.addFoundryAsset(foundry), "addFoundryAsset successful")

    amount = "1000000"
    await sendTx(forgeManager.setLiquidityManagers(deployer.ethWallet, addresses.liquidityManagerBot), "setLiquidityManagers successful")
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
}

const deployContract = async function (hre: HardhatRuntimeEnvironment, contractName: string, deployer: Deployer , args: any[]): Promise<Contract> {
    const artifact = await deployer.loadArtifact(contractName);
    return hre.deployer.deploy(artifact, args);
}

const sendTx = async (txResponse, successMessage?: string) => {
    const receipt = await (await txResponse).wait()
    if (receipt?.status == 1) {
        successMessage ? console.log(successMessage) : null
    } else {
        console.error("Transaction failed: " + receipt);
    }
}

export default deployScript;

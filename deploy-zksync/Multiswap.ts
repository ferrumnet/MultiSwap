import { HardhatRuntimeEnvironment, HttpNetworkConfig } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { Provider, Contract } from "zksync-ethers";
import addresses from "../constants/addresses.json";


const deployScript = async function (hre: HardhatRuntimeEnvironment) {
    const provider = new Provider((hre.network.config as HttpNetworkConfig).url)
    const wallet = (await hre.zksyncEthers.getWallet()).connect(provider)

    const weth = addresses.networks.zksync.weth
    const foundry = addresses.networks.zksync.foundry
    const deployer = new Deployer(hre, wallet);

    // Deploy contracts
    const fiberRouter = await deployContract(hre, "FiberRouter", deployer, [weth]);
    const fundManager = await deployContract(hre, "FundManager", deployer, []);
    const multiswapForge = await deployContract(hre, "MultiSwapForge", deployer, [weth]);
    const forgeManager = await deployContract(hre, "ForgeFundManager", deployer, []);
    
    // Post deploy configs
    await fiberRouter.setPool(fundManager);
    await fiberRouter.setGasWallet(addresses.gasWallet);
    await fundManager.setRouter(fiberRouter);
    await fundManager.addFoundryAsset(foundry);
    await fundManager.addSigner(addresses.signer);
    await fundManager.setLiquidityManagers(addresses.liquidityManager, addresses.liquidityManagerBot);
    await fundManager.setWithdrawalAddress(addresses.withdrawal);
    await fundManager.setSettlementManager(addresses.settlementManager);

    await multiswapForge.setPool(forgeManager);
    await multiswapForge.setGasEstimationAddress(addresses.gasEstimationWallet);
    await forgeManager.setRouter(multiswapForge);
    await forgeManager.addFoundryAsset(foundry);

    // Add routers and selectors. Selectors need to be computed with scripts/computeSelectors.ts and added to constants/addresses.json beforehand
    const swapRouters = addresses.networks.zksync.routers;
    for (const swapRouter of swapRouters) {
        const router = swapRouter.router;
        const selectors = swapRouter.selectors;
        for (const selector of selectors) {
            await fiberRouter.addRouterAndSelector(router, selector);
            await multiswapForge.addRouterAndSelector(router, selector);
        }
    }

    // Allow targets for other networks
    const otherNetworks = Object.keys(addresses.networks).filter((network) => network !== hre.network.name && network !== "hardhat");
    for (const otherNetwork of otherNetworks) {
        await fundManager.allowTarget(foundry, addresses.networks[otherNetwork].chainId, addresses.networks[otherNetwork].foundry);
    }
}

const deployContract = async function (hre: HardhatRuntimeEnvironment, contractName: string, deployer: Deployer , args: any[]): Promise<Contract> {
    const artifact = await deployer.loadArtifact(contractName);
    return hre.deployer.deploy(artifact, args);
}

export default deployScript;

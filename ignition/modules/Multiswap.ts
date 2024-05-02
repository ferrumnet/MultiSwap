import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"
import hre from "hardhat"
import addresses from "../../constants/addresses.json"

export default buildModule("Multiswap", (m) => {
  const currentNetwork = hre.network.name

  ///// Default values. Should only take the passed in value in unit tests
  const defaultWeth = addresses.networks[currentNetwork].weth
  const defaultFoundry = addresses.networks[currentNetwork].foundry
  
  const weth = m.getParameter("weth", defaultWeth)
  const foundry = m.getParameter("foundry", defaultFoundry)

  ///// Deploy contracts
  const fiberRouter = m.contract("FiberRouter", [weth])
  const fundManager = m.contract("FundManager")
  const multiswapForge = m.contract("MultiSwapForge", [weth])
  const forgeManager = m.contract("ForgeFundManager")

  ///// Post deploy configs
  m.call(fiberRouter, "setPool", [fundManager])
  m.call(fiberRouter, "setGasWallet", [addresses.gasWallet])
  m.call(fundManager, "setRouter", [fiberRouter])
  m.call(fundManager, "addFoundryAsset", [foundry]) 
  m.call(fundManager, "addSigner", [addresses.signer])
  m.call(fundManager, "setLiquidityManagers", [addresses.liquidityManager, addresses.liquidityManagerBot])
  m.call(fundManager, "setWithdrawalAddress", [addresses.withdrawal])
  m.call(fundManager, "setSettlementManager", [addresses.settlementManager])

  m.call(multiswapForge, "setPool", [forgeManager])
  m.call(multiswapForge, "setGasEstimationAddress", [addresses.gasEstimationWallet])
  m.call(forgeManager, "setRouter", [multiswapForge])
  m.call(forgeManager, "addFoundryAsset", [foundry])

  if (currentNetwork != "hardhat") {
    // Add routers and selectors. Selectors need to be computed with scripts/computeSelectors.ts and added to constants/addresses.json beforehand
    const swapRouters = addresses.networks[currentNetwork].routers
    for (const swapRouter of swapRouters) {
      const router = swapRouter.router
      const selectors = swapRouter.selectors
      for (const selector of selectors) {
        m.call(fiberRouter, "addRouterAndSelector", [router, selector], { id: `FiberRouter_addRouterAndSelector${selector}` })
        m.call(multiswapForge, "addRouterAndSelector", [router, selector], { id: `MultiSwapForge_addRouterAndSelector${selector}` })
      }
    }

    // Allow targets for other networks
    const otherNetworks = Object.keys(addresses.networks).filter((network) => network !== currentNetwork && network !== "hardhat")
    for (const otherNetwork of otherNetworks) {
      m.call(fundManager, "allowTarget", [
        foundry,
        addresses.networks[otherNetwork].chainId,
        addresses.networks[otherNetwork].foundry
      ], { id: `allowTarget${otherNetwork}` })
    }
  }

  return { fiberRouter, fundManager, multiswapForge, forgeManager };
});

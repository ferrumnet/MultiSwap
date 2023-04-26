require("dotenv").config();

const evmMultiswap = require("./sdk/evm/multiswap");
const evmFiberRouter = require("./sdk/evm/router");
const wasmMultiswap = require("./sdk/cosmwasm/multiswap");
const wasmFiberRouter = require("./sdk/cosmwasm/router");
let denom = process.env.DENOM;
let wallet2 = process.env.WALLET2;

function initContracts(
  chainType,
  fundManagerContract,
  fiberContract,
  rpc,
  privKey,
  gasPrice
) {
  if (chainType == "evm") {
    const multiswap = new evmMultiswap.MultiswapContract(
      fundManagerContract,
      rpc,
      privKey
    );
    const fiberRouter = new evmFiberRouter.FIBERRouterContract(
      fiberContract,
      rpc,
      privKey
    );
    return { multiswap, fiberRouter };
  } else if (chainType == "cosmwasm") {
    const multiswap = new wasmMultiswap.MultiswapContract(
      fundManagerContract,
      rpc,
      privKey,
      gasPrice
    );
    const fiberRouter = new wasmFiberRouter.FIBERRouterContract(
      fiberContract,
      rpc,
      privKey,
      gasPrice
    );
    return { multiswap, fiberRouter };
  }
  throw `unsupported chain type ${chainType}`;
}

const { multiswap: sourceMultiswap, fiberRouter: sourceFiberRouter } =
  initContracts(
    process.env.SOURCE_CHAIN_TYPE,
    process.env.SOURCE_FUND_MANAGER_CONTRACT,
    process.env.SOURCE_FIBER_ROUTER_CONTRACT,
    process.env.SOURCE_CHAIN_RPC,
    process.env.SOURCE_CHAIN_PRIV_KEY,
    process.env.SOURCE_GAS_PRICE
  );

const { multiswap: targetMultiswap, fiberRouter: targetFiberRouter } =
  initContracts(
    process.env.DESTINATION_CHAIN_TYPE,
    process.env.DESTINATION_FUND_MANAGER_CONTRACT,
    process.env.DESTINATION_FIBER_ROUTER_CONTRACT,
    process.env.DESTINATION_CHAIN_RPC,
    process.env.DESTINATION_CHAIN_PRIV_KEY,
    process.env.DESTINATION_GAS_PRICE
  );

//swap foundry asset on two networks
async function cudosWithdraw(
  targetTokenAddress,
  targetAddress,
  amount,
  salt,
  signature
) {
  const targetChainId = process.env.DESTINATION_CHAIN_ID;
  //   const isFoundryAsset = await sourceMultiswap.isFoundryAsset(
  //     sourceTokenAddress
  //   );

  //   if (isFoundryAsset == false) return;
  //   console.log("Token is foundry asset");
  //   console.log(
  //     "add foundry asset in source network",
  //     sourceTokenAddress,
  //     amount,
  //     targetChainId,
  //     targetFoundryTokenAddress,
  //     await sourceFiberRouter.getConnectedWallet()
  //   );

  console.log("successfully add foundry in source network !");

  //   const isTargetTokenFoundry = await targetMultiswap.isFoundryAsset(
  //     targetTokenAddress
  //   );

  console.log("Target token is foundry asset");
  console.log("withdraw and swap to foundry asset ...");

  const success = await targetFiberRouter.withdrawSigned(
    targetTokenAddress,
    targetAddress,
    amount,
    salt,
    signature
  );
  if (success) {
    console.log("successfully swap foundry token to target foundry token");
    console.log("Cheers! your bridge and swap was successful !!!");
  } else {
    console.log("failed to withdraw and swap foundry token");
  }

  return success;

  // const successes = await sourceFiberRouter.withdraw(process.env.DENOM, process.env.WALLET2, "100000");
}

// cudosWithdraw(
//   "acudos",
//   "cudos1uc2lvphjnxrkarpfa9w7m33hctynusswy8m44y",
//   "1000",
//   "0x10a7c04c194d6dc48fc4e5c0ccaad3f6611659bc00bf602d3538b7d45640c720",
//   "346ed3c395451d31d65788291acad06f4ac3b20f1e90f377b46037baaed7a24f57aac57498e2ccdf32ae254583055bd0950f814f49259a4d650ce6854ce33f3a1c"
// );

module.exports = cudosWithdraw;

import axios from "axios";
import { ContractTransactionResponse } from "ethers"
import addresses from "../../constants/addresses.json"
import fiberRouterArtifact from "../../artifacts/contracts/multiswap-contracts/FiberRouter.sol/FiberRouter.json"
import usdcAbi from "../abis/Usdc.json"
import wethAbi from "../abis/Weth.json"
import hre from "hardhat"
import { id } from "ethers";


export const main = async function (
    foundryAddress = addresses.networks.scroll.foundry,
    wethAddress = addresses.networks.scroll.weth,
) {
    const thisNetwork = hre.network.name
    const targetNetwork = addresses.networks.zksync.chainId
    const signer = await hre.ethers.provider.getSigner()
    // const wallet = new hre.ethers.Wallet(process.env.PRIVATE_KEY0!, provider)
    
    const foundry = new hre.ethers.Contract(foundryAddress, usdcAbi, signer)
    const weth = new hre.ethers.Contract(wethAddress, wethAbi, signer)
    const fiberRouterAddress = `0xD3bC74B544FFa733DeeAc750bdb672d9d0707a61`
    const fundManagerAddress = `0x6739020f6cAa161fbEC722CA868c030c665d65c9`
    const fiberRouter = new hre.ethers.Contract(fiberRouterAddress, fiberRouterArtifact.abi, signer)
    const fundManager = new hre.ethers.Contract(fundManagerAddress, fiberRouterArtifact.abi, signer)

    const fromToken = wethAddress
    const toToken = foundryAddress
    const amountIn = 1000000000000000
    // await sendTx(foundry.approve(await fiberRouter.getAddress(), amount), "Approve successful")

    // await sendTx(fiberRouter.swap(
    //     foundry,
    //     amount,
    //     targetNetwork,
    //     wethAddress,
    //     signer,
    //     id("some withdrawal data"),
    //     false,
    //     { value: 100 }
    // ), "Swap successful")

    await sendTx(weth.approve(fiberRouterAddress, BigInt(amountIn)), "Approve successful")

    const targetPathConfig = {
        params: {
            tokenIn: fromToken,
            tokenOut: toToken,
            amountIn
        }
    };

    console.log()

    console.log(`\nCalling Get Swap Route...`)
    let {data} = await axios.get(
        `https://aggregator-api.kyberswap.com/scroll/api/v1/routes`,
        targetPathConfig
    )

    const requestBody = {
        routeSummary: data.data.routeSummary,
        sender: fiberRouterAddress,
        recipient: fundManagerAddress,
        slippageTolerance: 200 // in bps, 200 = 2%
    }

    console.log(`\nCalling Build Swap Route...`)
    data = await axios.post(
        `https://aggregator-api.kyberswap.com/scroll/api/v1/route/build`,
        requestBody
    );

    console.log(await weth.getAddress())
    console.log(await weth.balanceOf(signer.address))
    console.log(BigInt(amountIn))
    console.log(data.data.data)

    await sendTx(fiberRouter.swapAndCrossOneInch(
        BigInt(amountIn),                                       // amountIn
        BigInt(1),                                           // minAmountOut
        await weth.getAddress(),                        // fromToken
        await foundry.getAddress(),                     // foundryToken
        addresses.networks.scroll.routers[0].router,                  // router
        data.data.data.data,   // routerCalldata
        targetNetwork,                                   // crossTargetNetwork
        addresses.networks.zksync.foundry,                     // crossTargetToken
        signer.address,                                         // crossTargetAddress
        id("some withdrawal data"),                     // withdrawalData
        false,                                          // cctpType
        { value: BigInt(10) }                                 // gas fee charge
    ), "Swap successful")

    const token = await foundry.getAddress()
    const payee = await signer.getAddress()
    const salt = id("some salt")
    const expiry = Math.floor(Date.now() / 1000) + 3600
    const amount = 1000000
    
    const domain = {
        name: "FUND_MANAGER",
        version: "000.004",
        chainId: 534352,
        verifyingContract: await fundManager.getAddress()
    }

    const types = {
        WithdrawSigned: [
            { name: "token", type: "address" },
            { name: "payee", type: "address" },
            { name: "amount", type: "uint256" },
            { name: "salt", type: "bytes32" },
            { name: "expiry", type: "uint256" },
        ]
    }

    const values = {
        token,
        payee,
        amount,
        salt,
        expiry,
    }
    
    const signature = await signer.signTypedData(domain, types, values)
    await sendTx(fiberRouter.withdrawSigned(
        token,
        payee,
        amount,
        salt,
        expiry,
        signature,
        false
    ), "WithdrawSigned successful")
}

const sendTx = async (txResponse: Promise<ContractTransactionResponse>, successMessage?: string) => {
    const receipt = await (await txResponse).wait()
    if (receipt?.status == 1) {
        successMessage ? console.log(successMessage) : null
    } else {
        console.error("Transaction failed: " + receipt);
    }
}

main().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});
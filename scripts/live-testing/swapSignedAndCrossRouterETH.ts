import { hexlify, randomBytes } from "ethers"
import addresses from "../../constants/addresses.json"
import fiberRouterArtifact from "../../artifacts/contracts/multiswap-contracts/FiberRouter.sol/FiberRouter.json"
import usdcAbi from "../abis/Usdc.json"
import wethAbi from "../abis/Weth.json"
import hre from "hardhat"
import { id } from "ethers";
import { sendTx, getSourceSignature, callOneInch } from "./helpers";


const main = async () => {
    const thisNetwork = hre.network.name
    const signer = await hre.ethers.provider.getSigner()
    const foundry = new hre.ethers.Contract(
        addresses.networks[thisNetwork].foundry,
        usdcAbi,
        signer
    )
    const weth = new hre.ethers.Contract(
        addresses.networks[thisNetwork].weth,
        wethAbi,
        signer
    )
    const fiberRouter = new hre.ethers.Contract(
        addresses.networks[thisNetwork].deployments.fiberRouter,
        fiberRouterArtifact.abi,
        signer
    )
    const amountIn = 100000000000 // 100 gwei
    const gasFee = 100


    const oneInchResponse = await callOneInch(
        await weth.getAddress(),
        await foundry.getAddress(),
        amountIn - gasFee,
        await fiberRouter.getAddress(),
        addresses.networks[thisNetwork].chainId
    )

    const minAmountOut = Number(oneInchResponse.dstAmount) / 2  // doesn't really matter

    const salt = hexlify(randomBytes(32))
    const expiry = Math.round((Date.now()/1000)) + 600
    
    const randomRecipient1 = "0xeb608fe026a4f54df43e57a881d2e8395652c58d"
    const randomRecipient2 = "0xBFBFE0e25835625efa98161e3286Ca1290057E1a"
    const recipient1Amount = 5
    const recipient2Amount = 10
    const feeAllocations = [
        {
            recipient: randomRecipient1,
            platformFee: recipient1Amount
        },
        {
            recipient: randomRecipient2,
            platformFee: recipient2Amount
        }
    ]
    const feeDistributionData = {
        feeAllocations: feeAllocations,
        totalPlatformFee: recipient1Amount + recipient2Amount,
        sourceAmountIn: amountIn,
        sourceAmountOut: amountIn - (recipient1Amount + recipient2Amount),
        destinationAmountIn: amountIn - (recipient1Amount + recipient2Amount),
        destinationAmountOut: 20000, // Can be anything
        salt,
        expiry,
    };
    const signature = await getSourceSignature(fiberRouter.target as string, foundry.target as string, feeDistributionData, addresses.networks[thisNetwork].chainId)

    await sendTx(fiberRouter.swapSignedAndCrossRouterETH(
        minAmountOut,
        await foundry.getAddress(),
        gasFee,
        addresses.networks[thisNetwork].routers[0].router,
        oneInchResponse.tx.data,
        {
            targetNetwork: addresses.networks.base.chainId,
            targetToken: addresses.networks.base.foundry,
            targetAddress: signer.address
        },
        id("some withdrawal data"),
        false,
        {
            ...feeDistributionData,
            signature
        },
        { value: amountIn }
    ), "Swap successful")
}


main().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});

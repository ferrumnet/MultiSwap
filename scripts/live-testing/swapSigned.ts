import { hexlify, randomBytes } from "ethers"
import addresses from "../../constants/addresses.json"
import fiberRouterArtifact from "../../artifacts/contracts/multiswap-contracts/FiberRouter.sol/FiberRouter.json"
import usdcAbi from "../abis/Usdc.json"
import hre from "hardhat"
import { id } from "ethers";
import { sendTx, getSourceSignature } from "./helpers";


const main = async () => {
    const thisNetwork = hre.network.name
    const signer = await hre.ethers.provider.getSigner()
    const foundry = new hre.ethers.Contract(
        addresses.networks[thisNetwork].foundry,
        usdcAbi,
        signer
    )
    const fiberRouter = new hre.ethers.Contract(
        addresses.networks[thisNetwork].deployments.fiberRouter,
        fiberRouterArtifact.abi,
        signer
    )
    const amountIn = 1000 // 0.1 cent
    await sendTx(foundry.approve(fiberRouter, BigInt(amountIn)), "Approve successful")

    const salt = hexlify(randomBytes(32))
    const expiry = Math.round((Date.now()/1000)) + 600
    
    const referral = "0xeb608fe026a4f54df43e57a881d2e8395652c58d"
    const referralFee = 50 // 50%
    const referralDiscount = 20 // 20%
    const amountOut = amountIn * 0.99  +  amountIn * 0.01 * (100 - referralFee) / 100 // 1% fee, but give back 0.2% again
    const feeDistributionData = {
        referral,
        referralFee,
        referralDiscount,
        sourceAmountIn: amountIn,
        sourceAmountOut: amountOut,
        destinationAmountIn: amountOut,
        destinationAmountOut: 20000, // Can be anything
        salt,
        expiry,
    };

    const signature = getSourceSignature(fiberRouter.target as string, foundry.target as string, feeDistributionData, addresses.networks[thisNetwork].chainId)


    await sendTx(fiberRouter.swapSigned(
        foundry,
        amountIn,
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
        { value: 100 }
    ), "Swap successful")
}


main().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});

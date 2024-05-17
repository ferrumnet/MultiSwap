import axios from "axios";
import { ContractTransactionResponse, hexlify, randomBytes } from "ethers"
import addresses from "../../constants/addresses.json"
import fiberRouterArtifact from "../../artifacts/contracts/multiswap-contracts/FiberRouter.sol/FiberRouter.json"
import usdcAbi from "../abis/Usdc.json"
import wethAbi from "../abis/Weth.json"
import hre from "hardhat"
import { id } from "ethers";


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
    const amountIn = 1000 // 1 cent
    await sendTx(foundry.approve(fiberRouter, BigInt(amountIn)), "Approve successful")

    const salt = hexlify(randomBytes(32))
    const expiry = Math.round((Date.now()/1000)) + 600
    
    const randomRecipient1 = "0xeb608fe026a4f54df43e57a881d2e8395652c58d"
    const randomRecipient2 = "0xBFBFE0e25835625efa98161e3286Ca1290057E1a"
    const recipient1Amount = 100
    const recipient2Amount = 150
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
        destinationAmountOut: 20000,
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

const getSourceSignature = async (fiberRouter:string, token:string, feeDistributionData, chainId:number) => {
    const signer = process.env.PRIVATE_GAS_ESTIMATION!
    const wallet = new hre.ethers.Wallet(signer)

    const domain = {
        name: "FEE_DISTRIBUTOR",
        version: "000.001",
        chainId,
        verifyingContract: fiberRouter
    }

    const types = {
        FeeAllocation: [
            { name: "recipient", type: "address" },
            { name: "platformFee", type: "uint256" }
        ],
        DistributeFees: [
            { name: "token", type: "address"},
            { name: "feeAllocations", type: "FeeAllocation[]" },
            { name: "totalPlatformFee", type: "uint256" },
            { name: "sourceAmountIn", type: "uint256" },
            { name: "sourceAmountOut", type: "uint256" },
            { name: "destinationAmountIn", type: "uint256" },
            { name: "destinationAmountOut", type: "uint256" },
            { name: "salt", type: "bytes32" },
            { name: "expiry", type: "uint256" },
        ]
    }

    const values = {
        token,
        feeAllocations: feeDistributionData.feeAllocations,
        totalPlatformFee: feeDistributionData.totalPlatformFee,
        sourceAmountIn: feeDistributionData.sourceAmountIn,
        sourceAmountOut: feeDistributionData.sourceAmountOut,
        destinationAmountIn: feeDistributionData.destinationAmountIn,
        destinationAmountOut: feeDistributionData.destinationAmountOut,
        salt: feeDistributionData.salt,
        expiry: feeDistributionData.expiry
    }
     
    return await wallet.signTypedData(domain, types, values)
}

const sendTx = async (txResponse: Promise<ContractTransactionResponse>, successMessage?: string) => {
    const receipt = await (await txResponse).wait()
    if (receipt?.status == 1) {
        successMessage ? console.log(successMessage) : null
        console.log("Transaction hash: " + receipt.hash)
    } else {
        console.error("Transaction failed: " + receipt);
    }
}

main().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});

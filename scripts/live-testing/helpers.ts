import { ContractTransactionResponse } from "ethers"
import hre from "hardhat"
const axios = require("axios");

export const callOneInch = async (
    src:string,
    dst:string,
    amount:number,
    from:string,
    chainId:string
) => {

    const url = `https://api.1inch.dev/swap/v6.0/${chainId}/swap`;

    const config = {
        headers: {
            "Authorization": `Bearer ${process.env.ONEINCH_API_KEY}`
        },
        params: {
            "src": src,
            "dst": dst,
            "amount": amount,
            "from": from,
            "slippage": "2",
            "disableEstimate": "true"
        }
    };

    try {
        const response = await axios.get(url, config);
        return response.data;
    } catch (error) {
        console.error(error);
    }
}


export const getSourceSignature = async (fiberRouter:string, token:string, feeDistributionData, chainId:number) => {
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

export const sendTx = async (txResponse: Promise<ContractTransactionResponse>, successMessage?: string) => {
    const receipt = await (await txResponse).wait()
    if (receipt?.status == 1) {
        successMessage ? console.log(successMessage) : null
        console.log("Transaction hash: " + receipt.hash)
    } else {
        console.error("Transaction failed: " + receipt);
    }
}
import { ethers } from "ethers";
const { hexlify, randomBytes } = ethers;
import addresses from "../../constants/addresses.json"
import fiberRouterArtifact from "../../artifacts/contracts/multiswap-contracts/FiberRouter.sol/FiberRouter.json"
const fundManagerArtifact = require("../../artifacts/contracts/multiswap-contracts/fundManager.sol/fundManager.json");
import usdcAbi from "../abis/Usdc.json"
import hre from "hardhat"
import { id } from "ethers";
import { sendTx, getSourceSignature } from "./helpers";

const main = async () => {
    const otherNetwork = "avalanche";

    const thisNetwork = hre.network.name;
    const signer = await hre.ethers.provider.getSigner();
    const fiberRouterAddress = addresses.networks[thisNetwork].deployments.fiberRouter;
    const fundManagerAddress = addresses.networks[thisNetwork].deployments.fundManager;
    const foundryAddress = addresses.networks[thisNetwork].foundry;
    const targetNetworkChainID = addresses.networks[otherNetwork].chainId;
    const targetFoundryToken = addresses.networks[otherNetwork].foundry;

    const foundry = new hre.ethers.Contract(
        foundryAddress,
        usdcAbi,
        signer
    );

    const fundManager = new hre.ethers.Contract(
        fundManagerAddress,
        fundManagerArtifact.abi,
        signer
    );

    const fiberRouter = new hre.ethers.Contract(
        fiberRouterAddress,
        fiberRouterArtifact.abi,
        signer
    );

    const amountIn = 2000000; // 1 USDC
    await sendTx(foundry.approve(fiberRouter, BigInt(amountIn)), "Approve successful")

    const salt = hexlify(randomBytes(32));
    const expiry = Math.round((Date.now() / 1000)) + 600;

    const referral = "0xdCd60Be5b153d1884e1E6E8C23145D6f3546315e";
    const referralFee = 1; // 50%
    const referralDiscount = 1; // 20%
    const amountOut = 1;
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

    const signature = await getSourceSignature(
        fiberRouterAddress,
        foundryAddress,
        feeDistributionData,
        addresses.networks[thisNetwork].chainId
    );

    console.log("Signature", signature);

    const destinationEid = addresses.networks[otherNetwork].stg.stgEndpointID;
    const composerAddress = addresses.networks[otherNetwork].deployments.fundManager;
    const targetAddress = "0xdCd60Be5b153d1884e1E6E8C23145D6f3546315e";

    // Convert targetAddress to buffer (remove "0x" prefix)
    const targetAddressBuffer = Buffer.from(targetAddress.slice(2), 'hex');

    // Concatenate buffers to get the encoded data
    const encodedData = Buffer.concat([targetAddressBuffer]);

    // Convert encoded data to hexadecimal string
    const composeMsg = '0x' + encodedData.toString('hex');

    console.log(composeMsg); // Outputs the hexadecimal representation

    const gasFee = await prepareTakeTaxi(fundManager, destinationEid, amountIn, composerAddress, composeMsg);
    let gasValue = BigInt(gasFee);
    const gasFeeWithBuffer = (gasValue * 105n / 100n).toString();
    console.log("gas fee: ", gasFeeWithBuffer);
    await sendTx(
        fiberRouter.swapSigned(
            foundryAddress,
            amountIn,
            {
                targetNetwork: targetNetworkChainID,
                targetToken: targetFoundryToken,
                targetAddress: "0xdCd60Be5b153d1884e1E6E8C23145D6f3546315e"
            },
            id("some withdrawal data"),
            false,
            true,
            {
                ...feeDistributionData,
                signature
            },
            { value: gasFeeWithBuffer }
        ), "Swap successful"
    );
}

main().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});

// Call prepareTakeTaxi function for estimating gas fee etc
async function prepareTakeTaxi(fundManager, dstEid, amount, composer, composeMsg) {
    const result = await fundManager.prepareTakeTaxi(dstEid, amount, composer, composeMsg);
    const messagingFee = result[2][0];
    console.log("messagingFee:", messagingFee);
    return messagingFee;
}

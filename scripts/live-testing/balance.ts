import { ethers } from "ethers";
import hre from "hardhat";
import addresses from "../../constants/addresses.json";
import usdcAbi from "../abis/Usdc.json";
const main = async () => {
    const thisNetwork = hre.network.name;
    const foundryAddress = addresses.networks[thisNetwork].foundry;
    const signer = await hre.ethers.provider.getSigner();
    const foundry = new hre.ethers.Contract(
        foundryAddress,
        usdcAbi,
        signer
    );
    const decimals = await foundry.decimals();
    const divisor = BigInt(10) ** BigInt(decimals);
    // Check balance every 30 seconds
    setInterval(async () => {
        const balance = await foundry.balanceOf(signer.getAddress());
        const balanceInWholeNumber = balance / divisor;
        console.log("Balance of the User:", balanceInWholeNumber.toString());
    }, 10000);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});

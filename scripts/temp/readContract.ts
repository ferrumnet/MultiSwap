import { ethers } from "ethers";

// RPC endpoint URL
// const rpcUrl = "https://base-mainnet.core.chainstack.com/e7aa01c976c532ebf8e2480a27f18278"
const rpcUrl = "https://nd-829-997-700.p2pify.com/790712c620e64556719c7c9f19ef56e3" // Arbitrum

// Create a provider
const provider = new ethers.JsonRpcProvider(rpcUrl);
const privateKey = process.env.PRIVATE_KEY0!;
const wallet = new ethers.Wallet(privateKey, provider);

const abi = [{"stateMutability":"view","type":"function","name":"get_dy","inputs":[{"name":"i","type":"uint256"},{"name":"j","type":"uint256"},{"name":"dx","type":"uint256"},{"name":"swap","type":"address"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"get_dx","inputs":[{"name":"i","type":"uint256"},{"name":"j","type":"uint256"},{"name":"dy","type":"uint256"},{"name":"swap","type":"address"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"calc_withdraw_one_coin","inputs":[{"name":"token_amount","type":"uint256"},{"name":"i","type":"uint256"},{"name":"swap","type":"address"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"calc_token_amount","inputs":[{"name":"amounts","type":"uint256[3]"},{"name":"deposit","type":"bool"},{"name":"swap","type":"address"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"calc_fee_get_dy","inputs":[{"name":"i","type":"uint256"},{"name":"j","type":"uint256"},{"name":"dx","type":"uint256"},{"name":"swap","type":"address"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"calc_fee_withdraw_one_coin","inputs":[{"name":"token_amount","type":"uint256"},{"name":"i","type":"uint256"},{"name":"swap","type":"address"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"calc_fee_token_amount","inputs":[{"name":"amounts","type":"uint256[3]"},{"name":"deposit","type":"bool"},{"name":"swap","type":"address"}],"outputs":[{"name":"","type":"uint256"}]}]
const contractAddress = "0x06452f9c013fc37169B57Eab8F50A7A48c9198A3"


async function readContract() {
    try {
        console.log("Reading contract...");
        const contract = new ethers.Contract(contractAddress, abi, wallet);
        const result = await contract.get_dy(1, 2, 10000, "0x960ea3e3c7fb317332d990873d354e18d7645590");
        console.log("Contract read successful! Result:", result.toString());
    } catch (error) {
        console.error("Error sending transaction:", error);
    }
}

// readContract();

let excludedProtocols = [
    "ARBITRUM_CURVE_V2_TRICRYPTO_NG",       // Arbitrum
    "ARBITRUM_ONE_INCH_LIMIT_ORDER",
    "ARBITRUM_ONE_INCH_LIMIT_ORDER_V2",
    "ARBITRUM_ONE_INCH_LIMIT_ORDER_V3",
    "ARBITRUM_ONE_INCH_LIMIT_ORDER_V4",
    "AVALANCHE_ONE_INCH_LIMIT_ORDER_V2",    // Avalanche
    "AVALANCHE_ONE_INCH_LIMIT_ORDER_V3",
    "AVALANCHE_ONE_INCH_LIMIT_ORDER_V4",
    "BASE_CURVE_V2_TRICRYPTO_NG",           // Base
    "BASE_ONE_INCH_LIMIT_ORDER_V3",
    "BASE_ONE_INCH_LIMIT_ORDER_V4",
    "BSC_ONE_INCH_LIMIT_ORDER",             // BSC
    "BSC_ONE_INCH_LIMIT_ORDER_V2",
    "BSC_ONE_INCH_LIMIT_ORDER_V3",
    "BSC_ONE_INCH_LIMIT_ORDER_V4",
    "CURVE_V2_TRICRYPTO_NG",                // Ethereum
    "ONE_INCH_LIMIT_ORDER",
    "ONE_INCH_LIMIT_ORDER_V2",
    "ONE_INCH_LIMIT_ORDER_V3",
    "ONE_INCH_LIMIT_ORDER_V4",
    "OPTIMISM_ONE_INCH_LIMIT_ORDER",        // Optimism
    "OPTIMISM_ONE_INCH_LIMIT_ORDER_V2",
    "OPTIMISM_ONE_INCH_LIMIT_ORDER_V3",
    "OPTIMISM_ONE_INCH_LIMIT_ORDER_V4",
    "ZKSYNC_ONE_INCH_LIMIT_ORDER_V3",       // zkSync
    "ZKSYNC_ONE_INCH_LIMIT_ORDER_V4"
].join(",");

console.log(excludedProtocols)
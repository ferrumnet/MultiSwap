const Web3 = require('web3');
const fiberRouterABI = require("../../artifacts/contracts/multiswap-contracts/FiberRouter.sol/FiberRouter.json");
const ethers = require('ethers');

// Main function
async function main() {
    const to = "0xB5d1E1Ff700CFC0c687F1Fc99284E94ab0ef63E5"; // Address to
    const amountIn = ethers.utils.parseEther('0.1'); // Convert value to a BigNumber
    const amountOut = ethers.utils.parseEther('0.004911665086678622'); // Convert value to a BigNumber    
    const foundryToken = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"; // Address of the foundryToken
    const targetToken = "0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD"; // Address of the targetToken
    const oneInchData = "0x000000000000000000000000e37e799d5077682fa0a244d46e5649f71457bd090000000000000000000000008ac76a51cc950d9822d68b83fe1ad97b32cd580d000000000000000000000000f8a0bf9cf54bb92f17374d9e9a321e6a111a51bd000000000000000000000000e37e799d5077682fa0a244d46e5649f71457bd09000000000000000000000000b5d1e1ff700cfc0c687f1fc99284e94ab0ef63e5000000000000000000000000000000000000000000000000016345785d8a00000000000000000000000000000000000000000000000000000011732224bf465e0000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000001600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008100000000000000000000000000000000000000000000000000000000006302a00000000000000000000000000000000000000000000000000011732224bf465eee63c1e581cd8ec24720426fe384be64246076b5b0e7a61cb28ac76a51cc950d9822d68b83fe1ad97b32cd580d1111111254eeb25477b68fb85ed929f73a960582000000000000000000000000000000000000000000000000000000000000008b1ccac8"; // Example oneInchData in bytes format
    const salt = ethers.utils.formatBytes32String("salt"); // Example salt in bytes32 format
    const expiry = 1709378963; // Example expiry value
    const funcSelector = 2;
    const fixedSignature = '0x6c643f8807be12221fbdd622ce5125d54d3c5dc7f545e5b5ea8b9677b4353cdd58471ac57acd011db8b7a381092fc5346273822a2be8f246e86e7d5827ddd0051c';

    const result = await withdrawSignedAndSwapOneInch(to, amountIn, amountOut, foundryToken, targetToken, oneInchData, funcSelector, salt, expiry, fixedSignature)
    console.log(result);
    }

async function withdrawSignedAndSwapOneInch(to, amountIn, amountOut, foundryToken, targetToken, oneInchData, funcSelector, salt, expiry, fixedSignature)
    {
    try {
    // Define the chain ID and Web3 RPC URL
    const chainId = 56;
    const web3RpcUrl = 'https://bsc-pokt.nodies.app'; // Update with your BSC node URL
    const ethProvider = new ethers.providers.JsonRpcProvider(web3RpcUrl);
    // Create a wallet using your private key
    // const signer = new ethers.Wallet(process.env.PRIVATE_KEY0);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY0, ethProvider);
    const fiberRouterAddress = "0xfc3c6f9B7c4C0d7d9C10C313BBfFD1ed89afb1a7";

    const fiberRouter = new ethers.Contract(
        fiberRouterAddress,
        fiberRouterABI.abi,
        ethProvider
    );
        // Call the swapRouter() function on your FiberRouter contract
        const res = await fiberRouter.connect(wallet).withdrawSignedAndSwapOneInch(
            to, amountIn, amountOut, foundryToken, targetToken, oneInchData, funcSelector, salt, expiry, fixedSignature);
    
        // Wait for the transaction receipt
        const receipt = await res.wait();
    
        if (receipt.status == 1) {
            console.log(`Successfully withdrawed on 1inch`, tx.hash);
        } else {
            console.log("Transaction failed");
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
    }
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

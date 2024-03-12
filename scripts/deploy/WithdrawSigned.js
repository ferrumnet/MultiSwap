const Web3 = require('web3');
const fiberRouterABI = require("../../artifacts/contracts/multiswap-contracts/FiberRouter.sol/FiberRouter.json");
const ethers = require('ethers');
const { ecsign, toRpcSig } = require("ethereumjs-util");

const NAME = "FUND_MANAGER";
const VERSION = "000.004";
    
// Function to calculate the domain separator
function domainSeparator(eth, contractAddress, netId) {
    const hashedName = Web3.utils.keccak256(Web3.utils.utf8ToHex(NAME));
    const hashedVersion = Web3.utils.keccak256(Web3.utils.utf8ToHex(VERSION));
    const typeHash = Web3.utils.keccak256(
        Web3.utils.utf8ToHex("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")
    );

    return Web3.utils.keccak256(
        eth.abi.encodeParameters(
            ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
            [typeHash, hashedName, hashedVersion, netId, contractAddress]
        )
    );
}

// Function to produce the hash of the message to be signed
function produceSignatureWithdrawSignedOneInchHash(eth, netId, contractAddress, 
    to, amountIn, amountOut, foundryToken, targetToken, oneInchData, salt, expiry) {

    const methodHash = Web3.utils.keccak256(
        Web3.utils.utf8ToHex('WithdrawSignedOneInch(address to,uint256 amountIn,uint256 amountOut,address foundryToken,address targetToken,bytes oneInchData,bytes32 salt,uint256 expiry)')
    );

    const params = ['bytes32', 'address', 'uint256', 'uint256', 'address', 'address', 'bytes', 'bytes32', 'uint256'];
    const structure = eth.abi.encodeParameters(params, [methodHash, to, amountIn, amountOut, foundryToken, targetToken, oneInchData, salt, expiry]);
    const structureHash = Web3.utils.keccak256(structure);
    const ds = domainSeparator(eth, NAME, VERSION, contractAddress, netId);

    return Web3.utils.soliditySha3("\x19\x01", ds, structureHash);
}

function fixSig(sig) {
    const rs = sig.substring(0, 64); // Use the first 64 characters for 'r' and 's'
    let v = sig.substring(64);
    if (v === '00' || v === '37' || v === '25') {
        v = '1b';
    } else if (v === '01' || v === '38' || v === '26') {
        v = '1c';
    }
    return rs + v;
}


// Main function
async function main() {
    const web3 = new Web3('https://bsc.meowrpc.com');

    // Replace these with actual values
    const netId = await web3.eth.net.getId();
    console.log(netId)
    const contractAddress = "0xBFE96b3524a5d31B803BA133844C002Beaa79373"; // Contract address
    const to = "0xB5d1E1Ff700CFC0c687F1Fc99284E94ab0ef63E5"; // Address to
    const amountIn = ethers.utils.parseEther('0.01'); // Convert value to a BigNumber
    const amountOut = ethers.utils.parseEther('0.159303769106631865'); // Convert value to a BigNumber    
    const foundryToken = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"; // Address of the foundryToken
    const targetToken = "0xA719b8aB7EA7AF0DDb4358719a34631bb79d15Dc"; // Address of the targetToken
    const oneInchData = "0x000000000000000000000000b5d1e1ff700cfc0c687f1fc99284e94ab0ef63e50000000000000000000000008ac76a51cc950d9822d68b83fe1ad97b32cd580d000000000000000000000000000000000000000000000000002386f26fc10000000000000000000000000000000000000000000000000000022aa4371d9a1d1b00000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000200000000000000003b7c4580a34337690711ce3f265f56ebd545dda00d7c040580000000000000003b7c45809faa4d36d9d7158b15f408bf7357288d6ad8bc048b1ccac8"; // Example oneInchData in bytes format
    const salt = ethers.utils.formatBytes32String("salt"); // Example salt in bytes32 format
    const expiry = 1709378963; // Example expiry value
    const funcSelector = 0;
    const privateKey = process.env.PRIVATE_KEY0; // Your private key for signing

    // Produce the hash of the message
    const signatureHash = produceSignatureWithdrawSignedOneInchHash(web3.eth, netId, contractAddress, 
        to, amountIn, amountOut, foundryToken, targetToken, oneInchData, salt, expiry);

        const sigP2 = ecsign(
            Buffer.from(signatureHash.replace("0x", ""), "hex"),
            Buffer.from(process.env.PRIVATE_KEY0.replace("0x", ""), "hex")
        );
        const fixedSignature = fixSig(toRpcSig(sigP2.v, sigP2.r, sigP2.s));
    console.log("signature hash:", signature.messageHash);

    console.log("Fixed Signature:", fixedSignature);
    // const result = await withdrawSignedAndSwapOneInch(to, amountIn, amountOut, foundryToken, targetToken, oneInchData, funcSelector, salt, expiry, fixedSignature)
    // console.log(result);
    }

async function withdrawSignedAndSwapOneInch(to, amountIn, amountOut, foundryToken, targetToken, oneInchData, salt, expiry, fixedSignature)
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
            to, amountIn, amountOut, foundryToken, targetToken, oneInchData, salt, expiry, fixedSignature);
    
        // Wait for the transaction receipt
        const receipt = await res.wait();
    
        if (receipt.status == 1) {
            console.log(`Successfully withdrawed on 1inch`);
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

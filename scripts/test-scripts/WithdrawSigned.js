const Web3 = require('web3');
const fiberRouterABI = require("../../artifacts/contracts/multiswap-contracts/FiberRouter.sol/FiberRouter.json");
const ethers = require('ethers');

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
    const ds = domainSeparator(eth, contractAddress, netId);

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
    const contractAddress = "0x"; // Contract address
    const to = "0x"; // Address to
    const amountIn = ethers.utils.parseEther('0.1'); // Convert value to a BigNumber
    const amountOut = ethers.utils.parseEther('0.130666666'); // Convert value to a BigNumber    
    const foundryToken = "0x"; // Address of the foundryToken
    const targetToken = "0x"; // Address of the targetToken
    const oneInchData = "0x"; // Example oneInchData in bytes format
    const salt = ethers.utils.formatBytes32String("salt"); // Example salt in bytes32 format
    const expiry = 1708673961; // Example expiry value
    const privateKey = process.env.PRIVATE_KEY0; // Your private key for signing

    // Produce the hash of the message
    const signatureHash = produceSignatureWithdrawSignedOneInchHash(web3.eth, netId, contractAddress, 
        to, amountIn, amountOut, foundryToken, targetToken, oneInchData, salt, expiry);

    // Sign the hash
    const signature = await web3.eth.accounts.sign(signatureHash, privateKey);
    console.log("signature hash:", signature.messageHash);

    const fixedSignature = fixSig(signature.signature);

    console.log("Fixed Signature:", fixedSignature);
    const result = await withdrawSignedAndSwapOneInch(to, amountIn, amountOut, foundryToken, targetToken, oneInchData, salt, expiry, fixedSignature)
    console.log(result);
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
    const fiberRouterAddress = "0x";

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

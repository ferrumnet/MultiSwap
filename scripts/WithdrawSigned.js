const Web3 = require('web3');

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
    to, swapRouter, amountIn, amountOut, foundryToken, targetToken, oneInchData, salt, expiry) {

    const methodHash = Web3.utils.keccak256(
        Web3.utils.utf8ToHex('WithdrawSignedOneInch(address to,address swapRouter,uint256 amountIn,uint256 amountOut,address foundryToken,address targetToken,bytes oneInchData,bytes32 salt,uint256 expiry)')
    );

    const params = ['bytes32', 'address', 'address', 'uint256', 'uint256', 'address', 'address', 'bytes', 'bytes32', 'uint256'];
    const structure = eth.abi.encodeParameters(params, [methodHash, to, swapRouter, amountIn, amountOut, foundryToken, targetToken, oneInchData, salt, expiry]);
    const structureHash = Web3.utils.keccak256(structure);
    const ds = domainSeparator(eth, contractAddress, netId);

    return Web3.utils.soliditySha3("\x19\x01", ds, structureHash);
}

// Function to adjust the signature
function fixSig(sig) {
    const rs = sig.substring(0, sig.length - 2);
    let v = sig.substring(sig.length - 2);
    if (v === '00' || v === '37' || v === '25') {
        v = '1b'
    } else if (v === '01' || v === '38' || v === '26') {
        v = '1c'
    }
    return rs + v;
}

// Main function
async function main() {
    const web3 = new Web3(/* your Ethereum node URL or Web3.givenProvider */);

    // Replace these with actual values
    const netId = await web3.eth.net.getId();
    const contractAddress = "0x..."; // Contract address
    const to = "0x..."; // Address to
    const swapRouter = "0x..."; // Address of the swapRouter
    const amountIn = 1000; // Example value for amountIn
    const amountOut = 1500; // Example value for amountOut
    const foundryToken = "0x..."; // Address of the foundryToken
    const targetToken = "0x..."; // Address of the targetToken
    const oneInchData = "0x..."; // Example oneInchData in bytes format
    const salt = "0x..."; // Example salt in bytes32 format
    const expiry = 123456789; // Example expiry value
    const privateKey = "YOUR_PRIVATE_KEY"; // Your private key for signing

    // Produce the hash of the message
    const signatureHash = produceSignatureWithdrawSignedOneInchHash(web3.eth, netId, contractAddress, 
        to, swapRouter, amountIn, amountOut, foundryToken, targetToken, oneInchData, salt, expiry);

    // Sign the hash
    const signature = await web3.eth.accounts.sign(signatureHash, privateKey);
    const fixedSignature = fixSig(signature.signature);

    console.log("Fixed Signature:", fixedSignature);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

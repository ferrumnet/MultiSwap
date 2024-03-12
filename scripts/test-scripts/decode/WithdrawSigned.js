const Web3 = require('web3');
const fiberRouterABI = require("../../artifacts/contracts/multiswap-contracts/FiberRouter.sol/FiberRouter.json");
const ethers = require('ethers');

const NAME = "FUND_MANAGER";
const VERSION = "000.004";
    
// Function to calculate the domain separator
function domainSeparator(eth, NAME, VERSION, netId, contractAddress) {
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
    // const ds = domainSeparator(eth, contractAddress, netId);
    const ds = domainSeparator(eth, NAME, VERSION, netId, contractAddress);

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
    const contractAddress = "0xaD8E49Eaa711905A4e3c12A49e44485330982e0F"; // Contract address 
    const to = "0xB5d1E1Ff700CFC0c687F1Fc99284E94ab0ef63E5"; // Address to
    const amountIn = ethers.utils.parseEther('0.1'); // Convert value to a BigNumber
    const amountOut = ethers.utils.parseEther('0.130666666'); // Convert value to a BigNumber    
    const foundryToken = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"; // Address of the foundryToken
    const targetToken = "0xfb5B838b6cfEEdC2873aB27866079AC55363D37E"; // Address of the targetToken
    const oneInchData = "0xe5d7bde600000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000380000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005af3107a4000800000000000000000000000000000000000000000000000000000000001fe6a000000000000000000000000fb58064d2a68b8616674b07b80a93ceb0ba67a6f000000000000000000000000000000000000000000000000000000331a4a18e6000000000000000000000000fb5b838b6cfeedc2873ab27866079ac55363d37e0000000000000000000000008ac76a51cc950d9822d68b83fe1ad97b32cd580d000000000000000000000000c42c67ea99882b2085e6a81fed01527b4c8a8e38000000000000000000000000c42c67ea99882b2085e6a81fed01527b4c8a8e3800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000fedd775fe200000000000000000000000000000000000000000000002c815c36f57f3dd00000000000a4000000a4000000a4000000a400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000000a4bf15fcd800000000000000000000000058ce0e6ef670c9a05622f4188faa03a9e12ee2e4000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000242cc2878d006a748e9500000000000000c42c67ea99882b2085e6a81fed01527b4c8a8e38000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000418da783c1119e6184aa0eefe983ac2a5d4d02bc6a26d2b19c8878319b04edb68d0e2db5d82b5d46a559b46e01a46494f5356df8dad142b26704cb347d480ad6d41b00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000077d4f1b0"; // Example oneInchData in bytes format
    const salt = "0xcca1dc0208ef60b52babdb577105c478bb14dfbf33d29c29263fa1af0b64f7f9"; // Example salt in bytes32 format
    const expiry = 1708516681; // Example expiry value
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
    const fiberRouterAddress = "0xc56f2a1240f2aDfAc3c822D564260a524d059e0d";  

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
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

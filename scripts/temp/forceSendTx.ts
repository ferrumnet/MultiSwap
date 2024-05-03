import { ethers } from "ethers";

// RPC endpoint URL
const rpcUrl = "https://base-mainnet.core.chainstack.com/e7aa01c976c532ebf8e2480a27f18278";

// Create a provider
const provider = new ethers.JsonRpcProvider(rpcUrl);
const privateKey = process.env.PRIVATE_GAS_ESTIMATION!;
const wallet = new ethers.Wallet(privateKey, provider);

// The raw transaction data
const rawTx = {
    to: "0x597b89069555bc45e03eceCCF3e4477CBbc17451", // Address of the receiver or contract
    value: 0, // Amount to send (for ETH transfers)
    data: "0x8f904a81000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda02913000000000000000000000000eedfdd620629c7432970d22488124fc92ad6d426000000000000000000000000000000000000000000000000000000000007a120a5ac9b36d333945ed14097adfc51700432858f5a4b08a2292efceb5a15e8351b00000000000000000000000000000000000000000000000000000000663bb9bb00000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000041fe9933002f0bdec1c14caa582f3654f14f9ddf312c1a00d2cf56bef02160e59c254f9131ab62696e2aaf1298da553cdcf7cd5a8c77fd6093d2dfb165215a30801b00000000000000000000000000000000000000000000000000000000000000", // Encoded contract call or empty for plain ETH transfer
    gasLimit: 1000000, // Maximum gas to spend
    gasPrice: 200000000, // Gas price in wei
};

console.log("Using wallet address: " + wallet.address);

async function sendTransaction() {
    try {
        console.log("Sending transaction...");
        const txResponse = await wallet.sendTransaction(rawTx);
        console.log("Transaction sent! Hash:", txResponse.hash);

        // Wait for the transaction to be mined
        const receipt = await txResponse.wait();
        console.log("Transaction confirmed in block:", receipt!.blockNumber);
    } catch (error) {
        console.error("Error sending transaction:", error);
    }
}

sendTransaction();

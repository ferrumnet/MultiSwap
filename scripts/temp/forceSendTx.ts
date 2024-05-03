import { ethers } from "ethers";

// RPC endpoint URL
const rpcUrl = "https://nd-829-997-700.p2pify.com/790712c620e64556719c7c9f19ef56e3";

// Create a provider
const provider = new ethers.JsonRpcProvider(rpcUrl);

// Your wallet private key (make sure this stays secure)
const privateKey = process.env.PRIVATE_KEY0!;
const wallet = new ethers.Wallet(privateKey, provider);

// The raw transaction data
const rawTx = {
    to: "0x699ed12c8B40f8F7d2b2cCB6Ab922193c0e8064A", // Address of the receiver or contract
    value: 0, // Amount to send (for ETH transfers)
    data: "0xa8cfc5c9000000000000000000000000ff970a61a04b1ca14834a43f5de4533ebddb5cc8000000000000000000000000eedfdd620629c7432970d22488124fc92ad6d426000000000000000000000000000000000000000000000000000000000007a120861460f92cb68c9c1e030d0bb5187595af00e25ee4b3726c2f94df1ce215f7f700000000000000000000000000000000000000000000000000000000663ba73b00000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000041b730dd4ab9779193c39843ec6c6b8762ee1c838465829558d56f5b9d4ff507a54c5d6da2d1a78be84cf167c635528f1a22b779d14da06f24f940153d9e520d381c00000000000000000000000000000000000000000000000000000000000000", // Encoded contract call or empty for plain ETH transfer
    gasLimit: 1000000, // Maximum gas to spend
    gasPrice: 10000000, // Gas price in wei
};

console.log(wallet.address);

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

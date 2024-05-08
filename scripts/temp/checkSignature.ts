import { ethers, keccak256, id } from "ethers";

// RPC endpoint URL
const rpcUrl = "https://base-mainnet.core.chainstack.com/e7aa01c976c532ebf8e2480a27f18278";

// Create a provider
const provider = new ethers.JsonRpcProvider(rpcUrl);
const privateKey = process.env.PRIVATE_GAS_ESTIMATION!;
const wallet = new ethers.Wallet(privateKey, provider);

async function sendTransaction() {
    const domain = {
        name: "FUND_MANAGER",
        version: "000.004",
        chainId: 42161,
        verifyingContract: "0x3E2aDfc6e9929FaEA8F3a2614145B7D55c130FFB"
    }
    
    const types = {
        withdrawSignedAndSwapRouter: [
            { name: "to", type: "address" },
            { name: "amountIn", type: "uint256" },
            { name: "minAmountOut", type: "uint256" },
            { name: "foundryToken", type: "address" },
            { name: "targetToken", type: "address" },
            { name: "router", type: "address" },
            { name: "routerCalldata", type: "bytes32" },
            { name: "salt", type: "bytes32" },
            { name: "expiry", type: "uint256" }
        ]
    }

    const to = "0xeedfdd620629c7432970d22488124fc92ad6d426"
    const amountIn = 10000
    const minAmountOut = "9247230027495409356"
    const foundryToken = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
    const targetToken = "0x9f6abbf0ba6b5bfa27f4deb6597cc6ec20573fda"
    const router = "0x111111125421ca6dc452d289314280a0f8842a65"
    const routerCalldata = "0x07ed2379000000000000000000000000e37e799d5077682fa0a244d46e5649f71457bd09000000000000000000000000af88d065e77c8cc2239327c5edb3a432268e58310000000000000000000000009f6abbf0ba6b5bfa27f4deb6597cc6ec20573fda000000000000000000000000e37e799d5077682fa0a244d46e5649f71457bd09000000000000000000000000eedfdd620629c7432970d22488124fc92ad6d426000000000000000000000000000000000000000000000000000000000007a1200000000000000000000000000000000000000000000000008054c2b7513086cc00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000015400000000000000000000000000000000000000000000013600010800001a0020d6bdbf78af88d065e77c8cc2239327c5edb3a432268e583100a007e5c0d20000000000000000000000000000000000000000000000000000ca00006302a00000000000000000000000000000000000000000000000000000000000000001ee63c1e580b1026b8e7276e7ac75410f1fcbbe21796e8f7526af88d065e77c8cc2239327c5edb3a432268e58313fec70f319a4145eba17765ae0c64b2232fe5bae00206ae40711b8002dc6c03fec70f319a4145eba17765ae0c64b2232fe5bae111111125421ca6dc452d289314280a0f8842a65000000000000000000000000000000000000000000000000000000000000000182af49447d8a07e3bd95bd0d56f35241523fbab10020d6bdbf789f6abbf0ba6b5bfa27f4deb6597cc6ec20573fda111111125421ca6dc452d289314280a0f8842a650000000000000000000000007c2ad3dd"
    const salt = "0x1efbd5538ca2e0037c403c9aa400ff617decfffbb021320cd0ab289cf1780745"
    const expiry = 1715277739
    id
    console.log(id(routerCalldata))
    const values = {
        to,
        amountIn,
        minAmountOut, 
        foundryToken, 
        targetToken,
        router,
        routerCalldata: keccak256(routerCalldata),
        salt,
        expiry                
    }
    
    const signature = await wallet.signTypedData(domain, types, values)
    console.log(signature)
}

sendTransaction();

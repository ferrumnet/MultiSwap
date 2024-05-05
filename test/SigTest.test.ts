import hre from "hardhat"
import { loadFixture} from "@nomicfoundation/hardhat-toolbox/network-helpers"
import addresses from "../constants/addresses_full.json"
import { expect, use } from "chai";
import { Contract, AbiCoder, id, Signer, keccak256, TypedDataEncoder } from "ethers";


let sigTest: Contract,
    mockToken: Contract,
    signer: Signer,
    user: Signer

async function multiswapDeploymentFixture() {
    [signer] = await hre.ethers.getSigners()
    sigTest = await hre.ethers.deployContract("SigTest")
    
}

describe('SigTest', () => {

    it("testing", async () => {
        await loadFixture(multiswapDeploymentFixture)

        const domain = {
            name: "FUND_MANAGER",
            version: "000.004",
            chainId: 42161,
            verifyingContract: "0xF78A21C15359120b2666f32a4BfABD8Dd12E6b3D"
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
        const amountIn = "500000"
        const minAmountOut = "9247230027495409356"
        const foundryToken = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
        const targetToken = "0x9f6abbf0ba6b5bfa27f4deb6597cc6ec20573fda"
        const router = "0x111111125421ca6dc452d289314280a0f8842a65"
        const routerCalldata = "0x07ed2379000000000000000000000000e37e799d5077682fa0a244d46e5649f71457bd09000000000000000000000000af88d065e77c8cc2239327c5edb3a432268e58310000000000000000000000009f6abbf0ba6b5bfa27f4deb6597cc6ec20573fda000000000000000000000000e37e799d5077682fa0a244d46e5649f71457bd09000000000000000000000000eedfdd620629c7432970d22488124fc92ad6d426000000000000000000000000000000000000000000000000000000000007a1200000000000000000000000000000000000000000000000008054c2b7513086cc00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000015400000000000000000000000000000000000000000000013600010800001a0020d6bdbf78af88d065e77c8cc2239327c5edb3a432268e583100a007e5c0d20000000000000000000000000000000000000000000000000000ca00006302a00000000000000000000000000000000000000000000000000000000000000001ee63c1e580b1026b8e7276e7ac75410f1fcbbe21796e8f7526af88d065e77c8cc2239327c5edb3a432268e58313fec70f319a4145eba17765ae0c64b2232fe5bae00206ae40711b8002dc6c03fec70f319a4145eba17765ae0c64b2232fe5bae111111125421ca6dc452d289314280a0f8842a65000000000000000000000000000000000000000000000000000000000000000182af49447d8a07e3bd95bd0d56f35241523fbab10020d6bdbf789f6abbf0ba6b5bfa27f4deb6597cc6ec20573fda111111125421ca6dc452d289314280a0f8842a650000000000000000000000007c2ad3dd"
        const salt = "0x1efbd5538ca2e0037c403c9aa400ff617decfffbb021320cd0ab289cf1780745"
        const expiry = "1715277739"
        
        const values = {
            to,
            amountIn,
            minAmountOut, 
            foundryToken, 
            targetToken,
            router,
            routerCalldata: id(routerCalldata),
            salt,
            expiry                
        }

        const privateKey = process.env.PRIVATE_GAS_ESTIMATION!;
        const wallet = new hre.ethers.Wallet(privateKey);
        
        // const signature = await wallet.signTypedData(domain, types, values)
        const signature = "0x1c3c74a71852c33eeeee6b7c59927315b9434189bcbb1e31756442a2462b14a436abea1db464bd0b01420bd807dc7f157fa360d88a3cb5ace19b54af8b7071bb1b"
        console.log("Backend sig: " + signature)
        
        await sigTest.checkSig(signature)
    })
    
})

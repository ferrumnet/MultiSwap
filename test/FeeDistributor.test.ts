import hre from "hardhat"
import { loadFixture} from "@nomicfoundation/hardhat-toolbox/network-helpers"
import addresses from "../constants/addresses_full.json"
import { expect, use } from "chai";
import { Contract, AbiCoder, id, Signer, keccak256, TypedDataEncoder } from "ethers";


let feeDistributor: Contract,
    mockToken: Contract,
    signer: Signer,
    user: Signer

async function multiswapDeploymentFixture() {
    [signer, user] = await hre.ethers.getSigners()
    feeDistributor = await hre.ethers.deployContract("FeeDistributorTest")
    await feeDistributor.addSigner(signer)
    mockToken = await hre.ethers.deployContract("Token")
}

describe('FeeDistributor', () => {

    const amount = 10000
    const expiry = Math.floor(Date.now() / 1000) + 60 * 60 * 24 // 24 hours
    
    const feeAllocations = [
        {
            recipient: "0xeb608fe026a4f54df43e57a881d2e8395652c58d",
            rateInBps: 100 // 1% fee
        },
        {
            recipient: "0xBFBFE0e25835625efa98161e3286Ca1290057E1a",
            rateInBps: 150 // 0.5% fee
        }
    ]

    it("should fail on invalid signature", async () => {
        await loadFixture(multiswapDeploymentFixture)
        const token = await mockToken.getAddress()

        const domain = {
            name: "FEE_DISTRIBUTOR",
            version: "000.001",
            chainId: 31337,
            verifyingContract: await feeDistributor.getAddress()
        };

        const types = {
            FeeAllocation: [
                { name: "recipient", type: "address" },
                { name: "rateInBps", type: "uint16" }
            ],
            DistributeFees: [
                { name: "token", type: "address" },
                { name: "feeAllocations", type: "FeeAllocation[]" },
                { name: "salt", type: "bytes32" },
                { name: "expiry", type: "uint256" }
            ],
        };

        const values = {
            token,
            feeAllocations,
            salt: id("unique_salt"),
            expiry
        };
        const signature = await signer.signTypedData(domain, types, values)

        const encoder = new TypedDataEncoder(types)
        console.log(encoder.encode(values))

        const feeDistributionData = {
            feeAllocations,
            salt: id("unique_salt"), // some salt value
            expiry,
            signature // the signature, replace accordingly
        };

        // const tx = await feeDistributor.testDistributeFees(
        //     token,
        //     amount,
        //     feeDistributionData
        // );
    })
})

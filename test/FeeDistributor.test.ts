import hre from "hardhat"
import { loadFixture} from "@nomicfoundation/hardhat-toolbox/network-helpers"
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
    const randomRecipient1 = "0xeb608fe026a4f54df43e57a881d2e8395652c58d"
    const randomRecipient2 = "0xBFBFE0e25835625efa98161e3286Ca1290057E1a"
    const recipient1Amount = 100
    const recipient2Amount = 150
    const feeAllocations = [
        {
            recipient: randomRecipient1,
            platformFee: recipient1Amount
        },
        {
            recipient: randomRecipient2,
            platformFee: recipient2Amount
        }
    ]

    const amount = 10000
    const totalPlatformFee = recipient1Amount + recipient2Amount
    const sourceAmountIn = amount
    const sourceAmountOut = amount - totalPlatformFee
    const destinationAmountIn = sourceAmountOut
    const destinationAmountOut = sourceAmountOut - 1000
    const salt = id("unique_salt")
    const expiry = Math.floor(Date.now() / 1000) + 60

    beforeEach(async () => {
        await loadFixture(multiswapDeploymentFixture)
        await mockToken.approve(feeDistributor, amount)
    })

    it("should fail on invalid signature", async () => {
        const token = await mockToken.getAddress()

        // Random invalid signature
        const signature = "0xefa1985c3bf7cddc69cc6cd46cf3995273a1d1bb7294b323fb18b58802ddefff1a9bc8d80027d803fb80acdf9912c9af2562a6b66c0812bfbe16f350546b723c1c"

        const feeDistributionData = {
            feeAllocations,
            totalPlatformFee,
            sourceAmountIn,
            sourceAmountOut,
            destinationAmountIn,
            destinationAmountOut,
            salt,
            expiry,
            signature
        };

        const tx = feeDistributor.testDistributeFees(
            token,
            amount,
            feeDistributionData
        );

        await expect(tx).to.be.revertedWith("FD: Invalid signature")
    })

    it("should distribute fees with valid signature", async () => {
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
                { name: "platformFee", type: "uint256" }
            ],
            DistributeFees: [
                { name: "token", type: "address" },
                { name: "feeAllocations", type: "FeeAllocation[]" },
                { name: "totalPlatformFee", type: "uint256" },
                { name: "sourceAmountIn", type: "uint256" },
                { name: "sourceAmountOut", type: "uint256" },
                { name: "destinationAmountIn", type: "uint256" },
                { name: "destinationAmountOut", type: "uint256" },
                { name: "salt", type: "bytes32" },
                { name: "expiry", type: "uint256" }
            ],
        };

        const values = {
            token,
            feeAllocations,
            totalPlatformFee,
            sourceAmountIn,
            sourceAmountOut,
            destinationAmountIn,
            destinationAmountOut,
            salt,
            expiry
        };

        const signature = signer.signTypedData(domain, types, values)

        const feeDistributionData = {
            feeAllocations,
            totalPlatformFee,
            sourceAmountIn,
            sourceAmountOut,
            destinationAmountIn,
            destinationAmountOut,
            salt,
            expiry,
            signature
        }

        const tx = feeDistributor.testDistributeFees(
            token,
            amount,
            feeDistributionData
        )

        await expect(tx).to.changeTokenBalances(
            mockToken,
            [signer, randomRecipient1, randomRecipient2],
            [-BigInt(amount), BigInt(recipient1Amount), BigInt(recipient2Amount)]
        )

        await expect(tx).to.emit(feeDistributor, "FeesDistributed").withArgs(
            token,
            amount,
            amount - totalPlatformFee,
            totalPlatformFee
        )
    })
})

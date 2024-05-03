import hre from "hardhat"
import { loadFixture} from "@nomicfoundation/hardhat-toolbox/network-helpers"
import addresses from "../constants/addresses_full.json"
import { expect, use } from "chai";
import { Contract, AbiCoder, id, Signer, keccak256 } from "ethers";


let feeDistributor: Contract,
    token: Contract,
    signer: Signer,
    user: Signer

async function multiswapDeploymentFixture() {
    [signer, user] = await hre.ethers.getSigners()
    feeDistributor = await hre.ethers.deployContract("FeeDistributorTest")
    token = await hre.ethers.deployContract("Token")
}

describe('FeeDistributor', () => {

    const amount = 10000

    it("should fail on invalid signature", async () => {
        await loadFixture(multiswapDeploymentFixture)
        const feeDistributionData = {
            feeAllocations: [
                {
                    recipient: signer,
                    rateInBps: 100 // 1% fee
                },
                {
                    recipient: user,
                    rateInBps: 50 // 0.5% fee
                }
            ],
            salt: id("random_salt"), // some salt value
            expiry: Math.floor(Date.now() / 1000) + 10, // expires in 1 hour
            signature: keccak256("0x1337") // the signature, replace accordingly
        };

        console.log(await feeDistributor.getDummyNumber())
        await feeDistributor.setDummyNumber(100)
        console.log(await feeDistributor.getDummyNumber())

        const tx = await feeDistributor.testDistributeFees(
            token,
            amount,
            feeDistributionData
        );
    })
})

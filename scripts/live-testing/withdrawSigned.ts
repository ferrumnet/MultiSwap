import { hexlify, randomBytes } from "ethers"
import addresses from "../../constants/addresses.json"
import fiberRouterArtifact from "../../artifacts/contracts/multiswap-contracts/FiberRouter.sol/FiberRouter.json"
import hre from "hardhat"
import { sendTx, getWithdrawSignature } from "./helpers";


const main = async () => {
    const thisNetwork = hre.network.name
    const signer = await hre.ethers.provider.getSigner()
    
    const fiberRouter = new hre.ethers.Contract(
        addresses.networks[thisNetwork].deployments.fiberRouter,
        fiberRouterArtifact.abi,
        signer
    )
    const amount = 100000 // 10 cents

    const salt = hexlify(randomBytes(32))
    const expiry = Math.round((Date.now()/1000)) + 600

    const inputArgs = {
        token: addresses.networks[thisNetwork].foundry,
        payee: signer.address,
        amount: amount,
        salt: salt,
        expiry: expiry
    }

    const signature = await getWithdrawSignature(
        addresses.networks[thisNetwork].deployments.fundManager,
        inputArgs,
        addresses.networks[thisNetwork].chainId,
    )

    await sendTx(fiberRouter.withdrawSigned(
        addresses.networks[thisNetwork].foundry,
        signer.address,
        amount,
        salt,
        expiry,
        signature,
        false
    ), "Withdraw successful")
}


main().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});

import { ethers, id, keccak256 } from "ethers";
import fiberRouterArtifact from "../../artifacts/contracts/multiswap-contracts/FiberRouter.sol/FiberRouter.json"


const main = async () => {
    const provider = new ethers.JsonRpcProvider('http://localhost:8545')
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY0!, provider)
    const fiberRouterAddress = `0x0cb6Cd4f3e9532c3A0DC336833c0f2B9FF5E9f63` // Replace with actual contract address
    const fundManagerAddress = `0x0cb6Cd4f3e9532c3A0DC336833c0f2B9FF5E9f63` // Replace with actual contract address
    const fiberRouter = new ethers.Contract(fiberRouterAddress, fiberRouterArtifact.abi, wallet)
    const fundManager = new ethers.Contract(fundManagerAddress, fiberRouterArtifact.abi, wallet)

    //######### Interacting with contracts is the same as ethers v5:
    const amountIn = 1000000
    const minAmountOut = 0
    const fromToken = `0x1111111111111111111111111111111111111111`
    const toToken = `0x1111111111111111111111111111111111111111`
    const recipient = `0x1111111111111111111111111111111111111111`
    const router = `1inchAddress`
    const routerCallData = `0x1111111111111111111111111111111111111111` // Replace with actual router call data

    // e.g. SwapOnSameNetwork()
    let tx = await fiberRouter.swap(
        amountIn,
        minAmountOut,
        fromToken,
        toToken,
        recipient,
        router,
        routerCallData
    
    )
    await tx.wait()

    // e.g. SwapOnSameNetworkETH()
    tx = await fiberRouter.swapOnSameNetworkETH(
        minAmountOut,
        toToken,
        recipient,
        router,
        routerCallData,
        { value: BigInt(amountIn) } // ETH amount in wei
    )

    // ethers v6 makes it slightly easier to do EIP712 signatures:
    // e.g. WithdrawSigned()
    const domain = {
        name: "FUND_MANAGER",
        version: "000.004",
        chainId: 1, // Replace with actual chain ID
        verifyingContract: await fundManager.getAddress()
    }

    const types = {
        WithdrawSigned: [
            { name: "token", type: "address" },
            { name: "payee", type: "address" },
            { name: "amount", type: "uint256" },
            { name: "salt", type: "bytes32" },
            { name: "expiry", type: "uint256" }
        ]
    }

    const values = {
        token: toToken,
        payee: wallet.address,
        amount: minAmountOut,
        salt: id("some salt"),
        expiry: 12345678
    }

    const signature = await wallet.signTypedData(domain, types, values)
    tx = await fiberRouter.withdrawSigned(
        toToken,
        wallet.address,
        minAmountOut,
        id("some salt"),
        12345678,
        signature
    )

    // e.g. WithdrawSignedWithSwap=    
    const types2 = {
        WithdrawSignedWithSwap: [
            { name: "to", type: "address" },
            { name: "amountIn", type: "uint256" },
            { name: "minAmountOut", type: "uint256" },
            { name: "foundryToken", type: "address" },
            { name: "targetToken", type: "address" },
            { name: "router", type: "address" },
            { name: "routerCallData", type: "bytes32" },
            { name: "salt", type: "bytes32" },
            { name: "expiry", type: "uint256" }
        ]
    }

    const values2 = {
        to: wallet.address,
        amountIn: amountIn,
        minAmountOut: minAmountOut,
        foundryToken: fromToken,
        targetToken: toToken,
        router: router,
        routerCallData: keccak256(routerCallData), // Hash the calldata
        salt: id("some other salt"),
        expiry: 12345678
    }
    const signature2 = await wallet.signTypedData(domain, types2, values2)
    tx = await fiberRouter.withdrawSignedWithSwap(
        wallet.address,
        amountIn,
        minAmountOut,
        fromToken,
        toToken,
        router,
        keccak256(routerCallData),
        id("some other salt"),
        12345678,
        signature2
    )
} 


main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});

import hre from "hardhat"
import { loadFixture} from "@nomicfoundation/hardhat-toolbox/network-helpers"
import addresses from "../constants/addresses.json"
import { expect } from "chai";
import { Contract, AbiCoder, id, Signer, keccak256 } from "ethers";
import { multiswap } from "../deploy/multiswap"


let weth: Contract,
    foundry: Contract,
    swapRouter: Contract,
    signer: Signer,
    user: Signer

async function multiswapDeploymentFixture() {
    [signer, user] = await hre.ethers.getSigners()
    weth = await hre.ethers.deployContract("WETH")
    foundry = await hre.ethers.deployContract("Token")
    swapRouter = await hre.ethers.deployContract("SwapRouter")

    // Mint some mock tokens
    await foundry.mint(await swapRouter.getAddress(), BigInt(1000000))
    await foundry.mint(await signer.getAddress(), BigInt(1000000))
    await weth.mint(await swapRouter.getAddress(), BigInt(1000000))
    await weth.mint(await signer.getAddress(), BigInt(1000000))

    // Pass in addresses to deployment script
    return multiswap(await foundry.getAddress(), await weth.getAddress())
}

describe('FiberRouter', () => {
    const mockRouterSelector = "0x268a380b" // selector for swapExactTokensForTokens in SwapRouter mock
    it('should deploy correctly', async () => {
        const { fiberRouter, fundManager } = await loadFixture(multiswapDeploymentFixture)

        expect(await fiberRouter.pool()).to.equal(fundManager.target)
        expect(await fiberRouter.weth()).to.equal(await weth.getAddress())
        expect(await fiberRouter.gasWallet()).to.equal(addresses["gasWallet"])
        expect(await fundManager.fiberRouter()).to.equal(fiberRouter.target)
        expect(await fundManager.isFoundryAsset(foundry)).to.equal(true)
        expect(await fundManager.signers(addresses["signer"])).to.equal(true)
        expect(await fundManager.liquidityManager()).to.equal(addresses["liquidityManager"])
        expect(await fundManager.liquidityManagerBot()).to.equal(addresses["liquidityManagerBot"])
        expect(await fundManager.withdrawalAddress()).to.equal(addresses["withdrawal"])
        expect(await fundManager.settlementManager()).to.equal(addresses["settlementManager"])
    })

    describe('router and selector', async () => {
        it('should add router and selector', async () => {
            const { fiberRouter } = await loadFixture(multiswapDeploymentFixture)
            const tx = fiberRouter.addRouterAndSelector(swapRouter, mockRouterSelector)
            await expect(tx).to.emit(fiberRouter, "RouterAndSelectorWhitelisted").withArgs(swapRouter, mockRouterSelector)
            expect(await fiberRouter.isAllowListed(swapRouter, mockRouterSelector)).to.equal(true)
        })

        it('should remove router and selector', async () => {
            const { fiberRouter } = await loadFixture(multiswapDeploymentFixture)
            const tx = fiberRouter.removeRouterAndSelector(swapRouter, mockRouterSelector)
            await expect(tx).to.emit(fiberRouter, "RouterAndSelectorRemoved").withArgs(swapRouter, mockRouterSelector)
            expect(await fiberRouter.isAllowListed(swapRouter, mockRouterSelector)).to.equal(false)
        })
    })

    describe("local swap then cross", async () => {
        let routerCallData:string,
            fiberRouter:Contract,
            fundManager:Contract,
            amountIn = 10000,
            amountOut = 9800,
            otherChainId = addresses.networks.ethereum.chainId

        beforeEach(async () => {
            ({ fiberRouter, fundManager } = await loadFixture(multiswapDeploymentFixture))
            // Whitelist the mock router and selector
            await fiberRouter.addRouterAndSelector(await swapRouter.getAddress(), mockRouterSelector)

            // Add test network to allow targets list, using ethereum as an example
            const otherChainFoundry = addresses.networks.ethereum.foundry
            await fundManager.allowTarget(
                await foundry.getAddress(),
                otherChainId,
                otherChainFoundry
            )
            
            // Approve and encode the calldata
            await weth.approve(await fiberRouter.getAddress(), amountIn)
            let abiCoder = AbiCoder.defaultAbiCoder()
            routerCallData = abiCoder.encode(
                ["uint256", "uint256", "address", "address", "address"],
                [amountIn, amountOut, await weth.getAddress(), await foundry.getAddress(), await fundManager.getAddress()]
            )
        })

        it("should not swap if it fails slippage checks", async () => {
            await expect(fiberRouter.swapTokensLocallyAndCross(
                amountIn,                                       // amountIn
                9900,                                           // minAmountOut
                await weth.getAddress(),                        // fromToken
                await foundry.getAddress(),                     // foundryToken
                await swapRouter.getAddress(),                  // router
                mockRouterSelector + routerCallData.slice(2),   // routerCallData
                otherChainId,                                   // crossTargetNetwork
                await foundry.getAddress(),                     // crossTargetToken
                await signer.getAddress(),                      // crossTargetAddress
                id("some withdrawal data"),                     // withdrawalData
                { value: 1000 }                                 // gas fee charge
            )).to.be.revertedWith("FR: Slippage check failed")
        })

        it("should swap token if all checks pass", async () => {
            const tx = fiberRouter.swapTokensLocallyAndCross(
                amountIn,                                       // amountIn
                9700,                                           // minAmountOut
                await weth.getAddress(),                        // fromToken
                await foundry.getAddress(),                     // foundryToken
                await swapRouter.getAddress(),                  // router
                mockRouterSelector + routerCallData.slice(2),   // routerCallData
                otherChainId,                                   // crossTargetNetwork
                await foundry.getAddress(),                     // crossTargetToken
                signer,                                         // crossTargetAddress
                id("some withdrawal data"),                     // withdrawalData
                { value: 1000 }                                 // gas fee charge
            )
            
            await expect(tx).to.changeTokenBalances(
                weth,
                [signer, fundManager, swapRouter],
                [-BigInt(amountIn), 0, BigInt(amountIn)]
            )

            await expect(tx).to.changeTokenBalances(
                foundry,
                [signer, fundManager, swapRouter],
                [0, amountOut, -BigInt(amountOut)]
            )

            await expect(tx).to.emit(fiberRouter, "Swap").withArgs(
                await weth.getAddress(),
                await foundry.getAddress(),
                31337,
                otherChainId,
                amountIn,
                await signer.getAddress(),
                await signer.getAddress(),
                amountOut,
                id("some withdrawal data"),
                1000
            )

        })

        it("should swap ETH if all checks pass", async () => {
            const minAmountOut = 9700
            const gasFee = 100
            const tx = fiberRouter.swapETHLocallyAndCross(      
                minAmountOut,                                   // minAmountOut
                await foundry.getAddress(),                     // foundryToken
                gasFee,                                         // gas fee
                await swapRouter.getAddress(),                  // router
                mockRouterSelector + routerCallData.slice(2),   // routerCallData
                otherChainId,                                   // crossTargetNetwork
                await foundry.getAddress(),                     // crossTargetToken
                signer,                                         // crossTargetAddress
                id("some withdrawal data"),                     // withdrawalData
                { value: amountIn + gasFee }                    // amountIn
            )
            
            await expect(tx).to.changeEtherBalances(
                [signer, fundManager, swapRouter],
                [-BigInt(amountIn + gasFee), 0, 0]
            )

            await expect(tx).to.changeTokenBalances(
                foundry,
                [signer, fundManager, swapRouter],
                [0, amountOut, -BigInt(amountOut)]
            )

            await expect(tx).to.emit(fiberRouter, "Swap").withArgs(
                await weth.getAddress(),
                await foundry.getAddress(),
                31337,
                otherChainId,
                amountIn,
                await signer.getAddress(),
                await signer.getAddress(),
                amountOut,
                id("some withdrawal data"),
                gasFee
            )

        })
    })

    describe("swap", async () => {
        it("should initiate a cross chain transfer", async () => {
            const { fiberRouter, fundManager } = await loadFixture(multiswapDeploymentFixture)
            const amount = 10000
            await foundry.approve(await fiberRouter.getAddress(), amount)
            const targetNetwork = 10
            
            const tx = fiberRouter.swap(
                foundry,
                amount,
                targetNetwork,
                weth,
                signer,
                id("some withdrawal data"),
                { value: 100 }
            )
            
            await expect(tx).to.changeTokenBalances(
                foundry,
                [signer, fundManager],
                [-BigInt(amount), BigInt(amount)]
            )

            await expect(tx).to.emit(fiberRouter, "Swap").withArgs(
                foundry,
                weth,
                31337,
                targetNetwork,
                amount,
                signer,
                signer,
                amount,
                id("some withdrawal data"),
                100
            )
        })
    })

    describe("Signed withdrawals", async () => {
        it("should be able to withdraw with valid signature", async () => {
            const { fiberRouter, fundManager } = await loadFixture(multiswapDeploymentFixture)
            await fundManager.addSigner(signer)
            await fundManager.setLiquidityManagers(signer, signer)
            const amount = 10000
            await foundry.approve(await fundManager.getAddress(), amount)
            await fundManager.addLiquidityByManager(await foundry.getAddress(), amount)
            
            const expiry = Math.floor(Date.now() / 1000) + 3600
            const token = await foundry.getAddress()
            const payee = await signer.getAddress()
            const salt = id("some salt")
            
            const domain = {
                name: "FUND_MANAGER",
                version: "000.004",
                chainId: 31337,
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
                token,
                payee,
                amount,
                salt,
                expiry
            }
            
            const signature = await signer.signTypedData(domain, types, values)
            const tx = fiberRouter.withdrawSigned(
                token,
                payee,
                amount,
                salt,
                expiry,
                signature
            )
            
            await expect(tx).to.changeTokenBalances(
                foundry,
                [signer, fundManager],
                [BigInt(amount), -BigInt(amount)]
            )

            await expect(tx).to.emit(fiberRouter, "Withdraw").withArgs(
                token,
                payee,
                amount,
                salt,
                signature
            )
        })

        it("should be able to swap and withdraw with valid signature", async () => {
            const { fiberRouter, fundManager } = await loadFixture(multiswapDeploymentFixture)
            await fundManager.addSigner(signer)
            await fundManager.setLiquidityManagers(signer, signer)
            const amount = 10000
            await foundry.approve(await fundManager.getAddress(), amount)
            await fundManager.addLiquidityByManager(await foundry.getAddress(), amount)
            await fiberRouter.addRouterAndSelector(await swapRouter.getAddress(), mockRouterSelector)
        
            const amountIn = 10000
            const amountOut = 9800
            const abiCoder = AbiCoder.defaultAbiCoder()
            const routerCallData = abiCoder.encode(
                ["uint256", "uint256", "address", "address", "address"],
                [amountIn, amountOut, await foundry.getAddress(), await weth.getAddress(), await user.getAddress()]
            )
            const salt = id("some salt")
            const expiry = Math.floor(Date.now() / 1000) + 3600
            
            const domain = {
                name: "FUND_MANAGER",
                version: "000.004",
                chainId: 31337,
                verifyingContract: await fundManager.getAddress()
            }
            
            const types = {
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

            const values = {
                to: await user.getAddress(),
                amountIn,
                minAmountOut: 9700,
                foundryToken: await foundry.getAddress(),
                targetToken: await weth.getAddress(),
                router: await swapRouter.getAddress(),
                routerCallData: keccak256(mockRouterSelector + routerCallData.slice(2)),
                salt,
                expiry                
            }
            
            const signature = await signer.signTypedData(domain, types, values)
            const tx = fiberRouter.withdrawSignedWithSwap(
                user,
                amountIn,
                9700, // slippage
                foundry,
                weth,
                swapRouter,
                mockRouterSelector + routerCallData.slice(2),
                salt,
                expiry,
                signature
            )

            await expect(tx).to.changeTokenBalances(
                foundry,
                [user, fundManager, swapRouter],
                [0, -BigInt(amount), BigInt(amount)]
            )

            await expect(tx).to.changeTokenBalances(
                weth,
                [user, fundManager, swapRouter],
                [amountOut, 0, -BigInt(amountOut)]
            )

            await expect(tx).to.emit(fiberRouter, "WithdrawWithSwap").withArgs(
                user,
                amountIn,
                amountOut,
                foundry,
                weth,
                swapRouter,
                mockRouterSelector + routerCallData.slice(2),
                salt,
                signature
            )
        })
    })

    describe("Same network swaps", async () => {
        it("should be able to swap tokens locally", async () => {
            const { fiberRouter, fundManager } = await loadFixture(multiswapDeploymentFixture)
            await fundManager.addSigner(signer)
            await fundManager.setLiquidityManagers(signer, signer)
            const amount = 10000
            await foundry.approve(await fundManager.getAddress(), amount)
            await fundManager.addLiquidityByManager(await foundry.getAddress(), amount)
            await fiberRouter.addRouterAndSelector(await swapRouter.getAddress(), mockRouterSelector)
            await foundry.approve(await fiberRouter.getAddress(), amount)

            const amountOut = 9800
            const abiCoder = AbiCoder.defaultAbiCoder()
            const routerCallData = mockRouterSelector + abiCoder.encode(
                ["uint256", "uint256", "address", "address", "address"],
                [amount, amountOut, await foundry.getAddress(), await weth.getAddress(), await signer.getAddress()]
            ).slice(2)

            const tx = fiberRouter.swapOnSameNetwork(
                amount,
                amountOut * 0.98,
                foundry,
                weth,
                signer,
                swapRouter,
                routerCallData
            )

            await expect(tx).to.changeTokenBalances(
                foundry,
                [signer, fundManager, swapRouter],
                [-BigInt(amount), 0, BigInt(amount)]
            )

            await expect(tx).to.changeTokenBalances(
                weth,
                [signer, fundManager, swapRouter],
                [amountOut, 0, -BigInt(amountOut)]
            )

            await expect(tx).to.emit(fiberRouter, "SwapSameNetwork").withArgs(
                foundry,
                weth,
                amount,
                amountOut,
                signer,
                signer
            )
        })

        it("should be able to swap from eth to some token locally", async () => {
            const { fiberRouter, fundManager } = await loadFixture(multiswapDeploymentFixture)
            await fundManager.addSigner(signer)
            await fundManager.setLiquidityManagers(signer, signer)
            const amount = 10000
            await foundry.approve(await fundManager.getAddress(), amount)
            await fundManager.addLiquidityByManager(await foundry.getAddress(), amount)
            await fiberRouter.addRouterAndSelector(await swapRouter.getAddress(), mockRouterSelector)

            const amountOut = 9800
            const abiCoder = AbiCoder.defaultAbiCoder()
            const routerCallData = mockRouterSelector + abiCoder.encode(
                ["uint256", "uint256", "address", "address", "address"],
                [amount, amountOut, await weth.getAddress(), await foundry.getAddress(), await signer.getAddress()]
            ).slice(2)

            const tx = fiberRouter.swapOnSameNetworkETH(
                amountOut * 0.98,
                foundry,
                signer,
                swapRouter,
                routerCallData,
                { value: amount }
            )

            await expect(tx).to.changeEtherBalances(
                [signer, fundManager, swapRouter, weth],
                [-BigInt(amount), 0, 0, BigInt(amount)]
            )

            await expect(tx).to.changeTokenBalances(
                weth,
                [signer, fundManager, swapRouter],
                [0, 0, BigInt(amount)]
            )

            await expect(tx).to.changeTokenBalances(
                foundry,
                [signer, fundManager, swapRouter],
                [BigInt(amountOut), 0, -BigInt(amountOut)]
            )

            await expect(tx).to.emit(fiberRouter, "SwapSameNetwork").withArgs(
                "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
                foundry,
                amount,
                amountOut,
                signer,
                signer
            )
        })
    })
})

import hre from "hardhat"
import { loadFixture} from "@nomicfoundation/hardhat-toolbox/network-helpers"
import addresses from "../constants/addresses.json"
import { expect } from "chai";
import { Contract, AbiCoder, id, Signer, keccak256, TypedDataEncoder } from "ethers";
import { multiswap } from "../deploy/multiswap"


let fiberRouter: Contract,
    fundManager: Contract,
    cctpFundManager: Contract,
    weth: Contract,
    foundry: Contract,
    swapRouter: Contract,
    tokenMessenger: Contract,
    signer: Signer,
    user: Signer

async function multiswapDeploymentFixture() {
    [signer, user] = await hre.ethers.getSigners()
    // Mock contracts
    weth = await hre.ethers.deployContract("WETH")
    foundry = await hre.ethers.deployContract("Token")
    swapRouter = await hre.ethers.deployContract("SwapRouter")
    tokenMessenger = await hre.ethers.deployContract("TokenMessenger")

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
    describe('Deployment', async () => {
        it('should deploy correctly', async () => {
            const { fiberRouter, fundManager, cctpFundManager } = await loadFixture(multiswapDeploymentFixture)
            
            expect(await fiberRouter.fundManager()).to.equal(fundManager.target)
            expect(await fiberRouter.cctpFundManager()).to.equal(cctpFundManager.target)
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
    })

    describe('router and selector', async () => {
        it('should add router and selector', async () => {
            const { fiberRouter } = await loadFixture(multiswapDeploymentFixture)
            const tx = fiberRouter.addRouterAndSelectors(swapRouter, [mockRouterSelector])
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

    describe("swapSigned", async () => {
        let fiberRouter:Contract,
            fundManager:Contract,
            amount = 10000,
            targetNetwork = addresses.networks.hardhat.chainId

        beforeEach(async () => {
            ({ fiberRouter, fundManager } = await loadFixture(multiswapDeploymentFixture))
            
            fiberRouter.addSigner(await signer.getAddress())

            // Allow itself to be a target for testing
            const otherChainFoundry = addresses.networks.hardhat.foundry
            await fundManager.allowTarget(
                await foundry.getAddress(),
                targetNetwork,
                otherChainFoundry
            )
        })

        it("should initiate a cross chain transfer with no fee allocations", async () => {
            await foundry.approve(await fiberRouter.getAddress(), amount)
            const salt = id("some_unique_salt")
            const expiry = Math.round((Date.now()/1000)) + 600
            
            const feeAllocations = [];
            const feeDistributionData = {
                feeAllocations: feeAllocations, // Array of FeeAllocation structs
                totalPlatformFee: 50,
                sourceAmountIn: 10000,
                sourceAmountOut: 10000,
                destinationAmountIn: 9950,
                destinationAmountOut: 20000,
                salt,
                expiry, // Example UNIX timestamp
            };
            const signature = getSourceSignature(fiberRouter.target as string, foundry.target as string, feeDistributionData)

            const tx = fiberRouter.swapSigned(
                foundry,
                amount,
                {
                    targetNetwork: targetNetwork,
                    targetToken: weth,
                    targetAddress: signer,
                },
                id("some withdrawal data"),
                false,
                {
                    ...feeDistributionData,
                    signature
                },
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
                100,
                0
            )
        })

        it("should initiate a cross chain transfer with 1 fee allocation", async () => {
            await foundry.approve(await fiberRouter.getAddress(), amount)
            const salt = id("some_unique_salt")
            const expiry = Math.round((Date.now()/1000)) + 600
            const recipient = "0xEb608fE026a4F54df43E57A881D2e8395652C58D"
            const platformFee = 20
            
            const feeAllocations = [
                {
                    recipient,
                    platformFee
                }
            ];

            const feeDistributionData = {
                feeAllocations: feeAllocations, // Array of FeeAllocation structs
                totalPlatformFee: 20,
                sourceAmountIn: 10000,
                sourceAmountOut: 10000,
                destinationAmountIn: 9980,
                destinationAmountOut: 20000,
                salt,
                expiry, // Example UNIX timestamp
            };
            const signature = getSourceSignature(fiberRouter.target as string, foundry.target as string, feeDistributionData)

            const tx = fiberRouter.swapSigned(
                foundry,
                amount,
                {
                    targetNetwork: targetNetwork,
                    targetToken: weth,
                    targetAddress: signer,
                },
                id("some withdrawal data"),
                false,
                {
                    ...feeDistributionData,
                    signature
                },
                { value: 100 }
            )
            
            await expect(tx).to.changeTokenBalances(
                foundry,
                [signer, fundManager, recipient],
                [-BigInt(amount), BigInt(amount - platformFee), BigInt(platformFee)]
            )

            await expect(tx).to.emit(fiberRouter, "Swap").withArgs(
                foundry,
                weth,
                31337,
                targetNetwork,
                amount,
                signer,
                signer,
                amount - platformFee,
                id("some withdrawal data"),
                100,
                0
            )
        })
    })

    describe("swapSignedAndCrossRouter", async () => {
        let fiberRouter:Contract,
            fundManager:Contract,
            amount = 10000,
            targetNetwork = addresses.networks.hardhat.chainId,
            routerCalldata:string,
            abiCoder = AbiCoder.defaultAbiCoder(),
            amountIn = 10000,
            amountOut = 9800

        beforeEach(async () => {
            ({ fiberRouter, fundManager } = await loadFixture(multiswapDeploymentFixture))
            
            fiberRouter.addSigner(await signer.getAddress())
            routerCalldata = abiCoder.encode(
                ["uint256", "uint256", "address", "address", "address"],
                [amountIn, amountOut, await weth.getAddress(), await foundry.getAddress(), await fiberRouter.getAddress()]
            )

            // Allow itself to be a target for testing
            const otherChainFoundry = addresses.networks.hardhat.foundry
            await fundManager.allowTarget(
                await foundry.getAddress(),
                targetNetwork,
                otherChainFoundry
            )
        })

        it("should initiate a cross chain transfer with no fee allocations", async () => {
            await foundry.approve(await fiberRouter.getAddress(), amount)
            await fiberRouter.addRouterAndSelectors(await swapRouter.getAddress(), [mockRouterSelector])
            const salt = id("some_unique_salt")
            const expiry = Math.round((Date.now()/1000)) + 600
            
            const feeAllocations = [];
            const feeDistributionData = {
                feeAllocations: feeAllocations, // Array of FeeAllocation structs
                totalPlatformFee: 0,
                sourceAmountIn: amountIn,
                sourceAmountOut: amountOut,
                destinationAmountIn: amountOut,
                destinationAmountOut: 20000,
                salt,
                expiry,
            };

            const signature = getSourceSignature(fiberRouter.target as string, foundry.target as string, feeDistributionData)
            
            await weth.approve(await fiberRouter.getAddress(), feeDistributionData.sourceAmountIn)
            const tx = fiberRouter.swapSignedAndCrossRouter(
                feeDistributionData.sourceAmountIn,
                feeDistributionData.sourceAmountOut,
                await weth.getAddress(),
                await foundry.getAddress(),
                await swapRouter.getAddress(),
                mockRouterSelector + routerCalldata.slice(2),
                {
                    targetNetwork: targetNetwork,
                    targetToken: foundry,
                    targetAddress: signer,
                },
                id("some withdrawal data"),
                false,
                {
                    ...feeDistributionData,
                    signature
                },
                { value: 100 }
            )
            
            await expect(tx).to.changeTokenBalances(
                weth,
                [signer, swapRouter],
                [-BigInt(amount), BigInt(amount)]
            )

            await expect(tx).to.emit(fiberRouter, "Swap").withArgs(
                weth,
                foundry,
                31337,
                targetNetwork,
                amountIn,
                signer,
                signer,
                amountOut,
                id("some withdrawal data"),
                100,
                0
            )
        })

        it("should initiate a cross chain transfer with one fee allocation", async () => {
            await foundry.approve(await fiberRouter.getAddress(), amount)
            await fiberRouter.addRouterAndSelectors(await swapRouter.getAddress(), [mockRouterSelector])
            const salt = id("some_unique_salt")
            const expiry = Math.round((Date.now()/1000)) + 600
            
            const feeAllocations = [{
                recipient: "0xEb608fE026a4F54df43E57A881D2e8395652C58D",
                platformFee: 50
            }];
            const feeDistributionData = {
                feeAllocations: feeAllocations, // Array of FeeAllocation structs
                totalPlatformFee: 50,
                sourceAmountIn: amountIn,
                sourceAmountOut: amountOut,
                destinationAmountIn: amountOut - 50,
                destinationAmountOut: 20000,
                salt,
                expiry,
            };

            const signature = getSourceSignature(fiberRouter.target as string, foundry.target as string, feeDistributionData)
            
            await weth.approve(await fiberRouter.getAddress(), feeDistributionData.sourceAmountIn)
            const tx = fiberRouter.swapSignedAndCrossRouter(
                feeDistributionData.sourceAmountIn,
                feeDistributionData.sourceAmountOut,
                await weth.getAddress(),
                await foundry.getAddress(),
                await swapRouter.getAddress(),
                mockRouterSelector + routerCalldata.slice(2),
                {
                    targetNetwork: targetNetwork,
                    targetToken: foundry,
                    targetAddress: signer,
                },
                id("some withdrawal data"),
                false,
                {
                    ...feeDistributionData,
                    signature
                },
                { value: 100 }
            )
            
            await expect(tx).to.changeTokenBalances(
                weth,
                [signer, swapRouter],
                [-BigInt(amount), BigInt(amount)]
            )

            await expect(tx).to.emit(fiberRouter, "Swap").withArgs(
                weth,
                foundry,
                31337,
                targetNetwork,
                amountIn,
                signer,
                signer,
                amountOut - 50,
                id("some withdrawal data"),
                100,
                0
            )
        })
    })

    // describe("local swap then cross", async () => {
    //     let routerCalldata:string,
    //         fiberRouter:Contract,
    //         fundManager:Contract,
    //         cctpFundManager:Contract,
    //         amountIn = 10000,
    //         amountOut = 9800,
    //         targetNetwork = addresses.networks.hardhat.chainId,
    //         abiCoder = AbiCoder.defaultAbiCoder()

    //     beforeEach(async () => {
    //         ({ fiberRouter, fundManager } = await loadFixture(multiswapDeploymentFixture))
    //         // Whitelist the mock router and selector
    //         await fiberRouter.addRouterAndSelector(await swapRouter.getAddress(), mockRouterSelector)

    //         // Add test network to allow targets list
    //         const otherChainFoundry = addresses.networks.hardhat.foundry
    //         await fundManager.allowTarget(
    //             await foundry.getAddress(),
    //             targetNetwork,
    //             otherChainFoundry
    //         )
            
    //         // Approve and encode the calldata
    //         await weth.approve(await fiberRouter.getAddress(), amountIn)
    //         abiCoder = AbiCoder.defaultAbiCoder()
    //         routerCalldata = abiCoder.encode(
    //             ["uint256", "uint256", "address", "address", "address"],
    //             [amountIn, amountOut, await weth.getAddress(), await foundry.getAddress(), await fundManager.getAddress()]
    //         )
    //     })

    //     it("should not swap if it fails slippage checks", async () => {
    //         await expect(fiberRouter.swapAndCrossRouter(
    //             amountIn,                                       // amountIn
    //             9900,                                           // minAmountOut
    //             await weth.getAddress(),                        // fromToken
    //             await foundry.getAddress(),                     // foundryToken
    //             await swapRouter.getAddress(),                  // router
    //             mockRouterSelector + routerCalldata.slice(2),   // routerCalldata
    //             targetNetwork,                                   // crossTargetNetwork
    //             await foundry.getAddress(),                     // crossTargetToken
    //             await signer.getAddress(),                      // crossTargetAddress
    //             id("some withdrawal data"),                     // withdrawalData
    //             false,                                          // cctpType
    //             { value: 1000 }                                 // gas fee charge
    //         )).to.be.revertedWith("FR: Slippage check failed")
    //     })

    //     it("should swap token if all checks pass", async () => {
    //         const tx = fiberRouter.swapAndCrossRouter(
    //             amountIn,                                       // amountIn
    //             9700,                                           // minAmountOut
    //             await weth.getAddress(),                        // fromToken
    //             await foundry.getAddress(),                     // foundryToken
    //             await swapRouter.getAddress(),                  // router
    //             mockRouterSelector + routerCalldata.slice(2),   // routerCalldata
    //             targetNetwork,                                   // crossTargetNetwork
    //             await foundry.getAddress(),                     // crossTargetToken
    //             signer,                                         // crossTargetAddress
    //             id("some withdrawal data"),                     // withdrawalData
    //             false,                                          // cctpType
    //             { value: 1000 }                                 // gas fee charge
    //         )
            
    //         await expect(tx).to.changeTokenBalances(
    //             weth,
    //             [signer, fundManager, swapRouter],
    //             [-BigInt(amountIn), 0, BigInt(amountIn)]
    //         )

    //         await expect(tx).to.changeTokenBalances(
    //             foundry,
    //             [signer, fundManager, swapRouter],
    //             [0, amountOut, -BigInt(amountOut)]
    //         )

    //         await expect(tx).to.emit(fiberRouter, "Swap").withArgs(
    //             await weth.getAddress(),
    //             await foundry.getAddress(),
    //             31337,
    //             targetNetwork,
    //             amountIn,
    //             await signer.getAddress(),
    //             await signer.getAddress(),
    //             amountOut,
    //             id("some withdrawal data"),
    //             1000
    //         )
    //     })

    //     it("should swap with cctp if all checks pass", async () => {
    //         await fiberRouter.initCCTP(tokenMessenger, foundry, cctpFundManager)
    //         await fiberRouter.setTargetCCTPNetwork(targetNetwork, targetNetwork, cctpFundManager)

    //         routerCalldata = abiCoder.encode(
    //             ["uint256", "uint256", "address", "address", "address"],
    //             [amountIn, amountOut, await weth.getAddress(), await foundry.getAddress(), await fiberRouter.getAddress()]
    //         )
            
    //         const tx = fiberRouter.swapAndCrossRouter(
    //             amountIn,                                       // amountIn
    //             9700,                                           // minAmountOut
    //             await weth.getAddress(),                        // fromToken
    //             await foundry.getAddress(),                     // foundryToken
    //             await swapRouter.getAddress(),                  // router
    //             mockRouterSelector + routerCalldata.slice(2),   // routerCalldata
    //             targetNetwork,                                   // crossTargetNetwork
    //             foundry,                     // crossTargetToken
    //             signer,                                         // crossTargetAddress
    //             id("some withdrawal data"),                     // withdrawalData
    //             true,                                          // cctpType
    //             { value: 1000 }                                 // gas fee charge
    //         )
            
    //         await expect(tx).to.changeTokenBalances(
    //             weth,
    //             [signer, fundManager, swapRouter],
    //             [-BigInt(amountIn), 0, BigInt(amountIn)]
    //         )

    //         await expect(tx).to.changeTokenBalances(
    //             foundry,
    //             [signer, cctpFundManager, swapRouter],
    //             [0, amountOut, -BigInt(amountOut)]
    //         )

    //         await expect(tx).to.emit(fiberRouter, "CCTPSwap").withArgs(
    //             foundry,
    //             amountOut,
    //             31337,
    //             targetNetwork,
    //             signer,
    //             cctpFundManager,
    //             1 // Mock will always return deposit nonce of 1
    //         )
    //     })

    //     it("should swap ETH if all checks pass", async () => {
    //         const minAmountOut = 9700
    //         const gasFee = 100
    //         const tx = fiberRouter.swapAndCrossRouterETH(      
    //             minAmountOut,                                   // minAmountOut
    //             await foundry.getAddress(),                     // foundryToken
    //             gasFee,                                         // gas fee
    //             await swapRouter.getAddress(),                  // router
    //             mockRouterSelector + routerCalldata.slice(2),   // routerCalldata
    //             targetNetwork,                                   // crossTargetNetwork
    //             await foundry.getAddress(),                     // crossTargetToken
    //             signer,                                         // crossTargetAddress
    //             id("some withdrawal data"),                     // withdrawalData
    //             false,                                          // cctpType
    //             { value: amountIn + gasFee }                    // amountIn
    //         )
            
    //         await expect(tx).to.changeEtherBalances(
    //             [signer, fundManager, swapRouter],
    //             [-BigInt(amountIn + gasFee), 0, 0]
    //         )

    //         await expect(tx).to.changeTokenBalances(
    //             foundry,
    //             [signer, fundManager, swapRouter],
    //             [0, amountOut, -BigInt(amountOut)]
    //         )

    //         await expect(tx).to.emit(fiberRouter, "Swap").withArgs(
    //             await weth.getAddress(),
    //             await foundry.getAddress(),
    //             31337,
    //             targetNetwork,
    //             amountIn,
    //             await signer.getAddress(),
    //             await signer.getAddress(),
    //             amountOut,
    //             id("some withdrawal data"),
    //             gasFee
    //         )

    //     })

    //     it("should swap ETH with cctp if all checks pass", async () => {
    //         await fiberRouter.initCCTP(tokenMessenger, foundry, cctpFundManager)
    //         await fiberRouter.setTargetCCTPNetwork(targetNetwork, targetNetwork, cctpFundManager)

    //         routerCalldata = abiCoder.encode(
    //             ["uint256", "uint256", "address", "address", "address"],
    //             [amountIn, amountOut, await weth.getAddress(), await foundry.getAddress(), await fiberRouter.getAddress()]
    //         )

    //         const minAmountOut = 9700
    //         const gasFee = 100
    //         const tx = fiberRouter.swapAndCrossRouterETH(      
    //             minAmountOut,                                   // minAmountOut
    //             await foundry.getAddress(),                     // foundryToken
    //             gasFee,                                         // gas fee
    //             await swapRouter.getAddress(),                  // router
    //             mockRouterSelector + routerCalldata.slice(2),   // routerCalldata
    //             targetNetwork,                                   // crossTargetNetwork
    //             await foundry.getAddress(),                     // crossTargetToken
    //             signer,                                         // crossTargetAddress
    //             id("some withdrawal data"),                     // withdrawalData
    //             true,                                          // cctpType
    //             { value: amountIn + gasFee }                    // amountIn
    //         )
            
    //         await expect(tx).to.changeEtherBalances(
    //             [signer, fundManager, swapRouter],
    //             [-BigInt(amountIn + gasFee), 0, 0]
    //         )

    //         await expect(tx).to.changeTokenBalances(
    //             foundry,
    //             [signer, cctpFundManager, swapRouter],
    //             [0, amountOut, -BigInt(amountOut)]
    //         )

    //         await expect(tx).to.emit(fiberRouter, "CCTPSwap").withArgs(
    //             foundry,
    //             amountOut,
    //             31337,
    //             targetNetwork,
    //             signer,
    //             cctpFundManager,
    //             1 // Mock will always return deposit nonce of 1
    //         )

    //     })
    // })

    describe("Signed withdrawals", async () => {
        it("should be able to withdraw with valid signature", async () => {
            const { fiberRouter, fundManager } = await loadFixture(multiswapDeploymentFixture)
            await fundManager.addSigner(signer)
            await fundManager.setLiquidityManagers(signer, signer)
            const amount = 10000
            await foundry.approve(await fundManager.getAddress(), amount)
            await fundManager.addLiquidityByManager(await foundry.getAddress(), amount)
            
            const token = await foundry.getAddress()
            const payee = await signer.getAddress()
            const salt = id("some salt")
            const expiry = Math.floor(Date.now() / 1000) + 3600
            
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
                    { name: "expiry", type: "uint256" },
                ]
            }

            const values = {
                token,
                payee,
                amount,
                salt,
                expiry,
            }
            
            const signature = await signer.signTypedData(domain, types, values)
            const tx = fiberRouter.withdrawSigned(
                token,
                payee,
                amount,
                salt,
                expiry,
                signature,
                false
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
            await fiberRouter.addRouterAndSelectors(await swapRouter.getAddress(), [mockRouterSelector])
        
            const amountIn = 10000
            const amountOut = 9800
            const abiCoder = AbiCoder.defaultAbiCoder()
            const routerCalldata = abiCoder.encode(
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
                withdrawSignedAndSwapRouter: [
                    { name: "to", type: "address" },
                    { name: "amountIn", type: "uint256" },
                    { name: "minAmountOut", type: "uint256" },
                    { name: "foundryToken", type: "address" },
                    { name: "targetToken", type: "address" },
                    { name: "router", type: "address" },
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
                salt,
                expiry                
            }
            
            const signature = await signer.signTypedData(domain, types, values)
            const tx = fiberRouter.withdrawSignedAndSwapRouter(
                user,
                amountIn,
                9700, // slippage
                foundry,
                weth,
                swapRouter,
                mockRouterSelector + routerCalldata.slice(2),
                salt,
                expiry,
                signature,
                false
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

            await expect(tx).to.emit(fiberRouter, "WithdrawRouter").withArgs(
                user,
                amountIn,
                amountOut,
                foundry,
                weth,
                swapRouter,
                mockRouterSelector + routerCalldata.slice(2),
                salt,
                signature
            )
        })
    })

    // describe("Same network swaps", async () => {
    //     it("should be able to swap tokens locally", async () => {
    //         const { fiberRouter, fundManager } = await loadFixture(multiswapDeploymentFixture)
    //         await fundManager.addSigner(signer)
    //         await fundManager.setLiquidityManagers(signer, signer)
    //         const amount = 10000
    //         await foundry.approve(await fundManager.getAddress(), amount)
    //         await fundManager.addLiquidityByManager(await foundry.getAddress(), amount)
    //         await fiberRouter.addRouterAndSelector(await swapRouter.getAddress(), mockRouterSelector)
    //         await foundry.approve(await fiberRouter.getAddress(), amount)

    //         const amountOut = 9800
    //         const abiCoder = AbiCoder.defaultAbiCoder()
    //         const routerCalldata = mockRouterSelector + abiCoder.encode(
    //             ["uint256", "uint256", "address", "address", "address"],
    //             [amount, amountOut, await foundry.getAddress(), await weth.getAddress(), await signer.getAddress()]
    //         ).slice(2)

    //         const tx = fiberRouter.swapOnSameNetwork(
    //             amount,
    //             amountOut * 0.98,
    //             foundry,
    //             weth,
    //             signer,
    //             swapRouter,
    //             routerCalldata
    //         )

    //         await expect(tx).to.changeTokenBalances(
    //             foundry,
    //             [signer, fundManager, swapRouter],
    //             [-BigInt(amount), 0, BigInt(amount)]
    //         )

    //         await expect(tx).to.changeTokenBalances(
    //             weth,
    //             [signer, fundManager, swapRouter],
    //             [amountOut, 0, -BigInt(amountOut)]
    //         )

    //         await expect(tx).to.emit(fiberRouter, "SwapSameNetwork").withArgs(
    //             foundry,
    //             weth,
    //             amount,
    //             amountOut,
    //             signer,
    //             signer
    //         )
    //     })

    //     it("should be able to swap from eth to some token locally", async () => {
    //         const { fiberRouter, fundManager } = await loadFixture(multiswapDeploymentFixture)
    //         await fundManager.addSigner(signer)
    //         await fundManager.setLiquidityManagers(signer, signer)
    //         const amount = 10000
    //         await foundry.approve(await fundManager.getAddress(), amount)
    //         await fundManager.addLiquidityByManager(await foundry.getAddress(), amount)
    //         await fiberRouter.addRouterAndSelector(await swapRouter.getAddress(), mockRouterSelector)

    //         const amountOut = 9800
    //         const abiCoder = AbiCoder.defaultAbiCoder()
    //         const routerCalldata = mockRouterSelector + abiCoder.encode(
    //             ["uint256", "uint256", "address", "address", "address"],
    //             [amount, amountOut, await weth.getAddress(), await foundry.getAddress(), await signer.getAddress()]
    //         ).slice(2)

    //         const tx = fiberRouter.swapOnSameNetworkETH(
    //             amountOut * 0.98,
    //             foundry,
    //             signer,
    //             swapRouter,
    //             routerCalldata,
    //             { value: amount }
    //         )

    //         await expect(tx).to.changeEtherBalances(
    //             [signer, fundManager, swapRouter, weth],
    //             [-BigInt(amount), 0, 0, BigInt(amount)]
    //         )

    //         await expect(tx).to.changeTokenBalances(
    //             weth,
    //             [signer, fundManager, swapRouter],
    //             [0, 0, BigInt(amount)]
    //         )

    //         await expect(tx).to.changeTokenBalances(
    //             foundry,
    //             [signer, fundManager, swapRouter],
    //             [BigInt(amountOut), 0, -BigInt(amountOut)]
    //         )

    //         await expect(tx).to.emit(fiberRouter, "SwapSameNetwork").withArgs(
    //             "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    //             foundry,
    //             amount,
    //             amountOut,
    //             signer,
    //             signer
    //         )
    //     })
    // })

    // describe("CCTP", async () => {
    //     let fiberRouter:Contract,
    //         cctpFundManager:Contract,
    //         fundManager:Contract,
    //         routerCalldata:string,
    //         amountIn = 10000,
    //         amountOut = 9800,
    //         otherChainId = addresses.networks.ethereum.chainId,
    //         targetNetwork = 31337 // Hardhat chainID
        
    //     beforeEach(async () => {
    //         ({ fiberRouter, fundManager, cctpFundManager } = await loadFixture(multiswapDeploymentFixture))
    //         await fiberRouter.initCCTP(tokenMessenger, foundry, cctpFundManager)
    //         await fiberRouter.setTargetCCTPNetwork(targetNetwork, targetNetwork, cctpFundManager)

            
    //     })

    //     it("should be able to cross chain transfer tokens with CCTP", async () => {
    //         const amount = 10000
    //         await foundry.approve(await fiberRouter.getAddress(), amount)
            
    //         const tx = fiberRouter.swap(
    //             foundry,
    //             amount,
    //             targetNetwork,
    //             weth,
    //             signer,
    //             id("some withdrawal data"),
    //             true,
    //             { value: 100 }
    //         )
            
    //         await expect(tx).to.changeTokenBalances(
    //             foundry,
    //             [signer, fundManager, cctpFundManager],
    //             [-BigInt(amount), 0, BigInt(amount)]
    //         )

    //         await expect(tx).to.emit(fiberRouter, "CCTPSwap").withArgs(
    //             foundry,
    //             amount,
    //             31337,
    //             targetNetwork,
    //             signer,
    //             cctpFundManager,
    //             1 // Mock will always return deposit nonce of 1
    //         )
    //     })
    // })
})

const getSourceSignature = async (fiberRouter:string, token:string, feeDistributionData) => {
    const signer = process.env.PRIVATE_GAS_ESTIMATION!
    const wallet = new hre.ethers.Wallet(signer)

    const domain = {
        name: "FEE_DISTRIBUTOR",
        version: "000.001",
        chainId: 31337,
        verifyingContract: fiberRouter
    }

    const types = {
        FeeAllocation: [
            { name: "recipient", type: "address" },
            { name: "platformFee", type: "uint256" }
        ],
        DistributeFees: [
            { name: "token", type: "address"},
            { name: "feeAllocations", type: "FeeAllocation[]" },
            { name: "totalPlatformFee", type: "uint256" },
            { name: "sourceAmountIn", type: "uint256" },
            { name: "sourceAmountOut", type: "uint256" },
            { name: "destinationAmountIn", type: "uint256" },
            { name: "destinationAmountOut", type: "uint256" },
            { name: "salt", type: "bytes32" },
            { name: "expiry", type: "uint256" },
        ]
    }

    const values = {
        token,
        feeAllocations: feeDistributionData.feeAllocations,
        totalPlatformFee: feeDistributionData.totalPlatformFee,
        sourceAmountIn: feeDistributionData.sourceAmountIn,
        sourceAmountOut: feeDistributionData.sourceAmountOut,
        destinationAmountIn: feeDistributionData.destinationAmountIn,
        destinationAmountOut: feeDistributionData.destinationAmountOut,
        salt: feeDistributionData.salt,
        expiry: feeDistributionData.expiry
    }
     
    return await wallet.signTypedData(domain, types, values)
}

const { ethers } = require("hardhat");
const { expect } = require("chai");
const { BigNumber } = require("ethers");
const Web3 = require("web3");
const { parseEther } = require("ethers/lib/utils");
const { ecsign, toRpcSig } = require("ethereumjs-util");
const { domainSeparator, fixSig } = require("../scripts/utils/BridgeUtils");
const hardhatConfig = require("../hardhat.config");

function signatureHash(web3, token, payee, amount, salt, ds) {
   const methodHash = Web3.utils.keccak256(
      Web3.utils.utf8ToHex(
         "WithdrawSigned(address token,address payee,uint256 amount,bytes32 salt)"
      )
   );
   const params = ["bytes32", "address", "address", "uint256", "bytes32"];
   const structure = web3.eth.abi.encodeParameters(params, [
      methodHash,
      token,
      payee,
      amount,
      salt,
   ]);
   const structureHash = Web3.utils.keccak256(structure);
   return Web3.utils.soliditySha3("\x19\x01", ds, structureHash);
}

describe("FundManager", async () => {
   const NAME = "FUND MANAGER";
   const VERSION = "000.004";
   const networkId = "999";
   const fee = "1000";
   const salt = ethers.utils.formatBytes32String("1234");
   let tx;
   let signature;

   before("setup", async () => {
      [owner, addr1, addr2, addr3, addr4, signer, router, ...addrs] =
         await ethers.getSigners();

      // distributoFactory = await ethers.getContractFactory("GeneralTaxDistributor");
      // distributor = await distributoFactory.connect(owner).deploy();

      tokenFactory = await ethers.getContractFactory("MockToken");
      token1 = await tokenFactory.connect(owner).deploy();
      token2 = await tokenFactory.connect(owner).deploy();

      fmFactory = await ethers.getContractFactory("FundManager");
      fundManager = await fmFactory.connect(owner).deploy();
      await fundManager.deployed();

      await fundManager.initialize();

      await token1.mint(owner.address, parseEther("100"));
      await token2.mint(owner.address, parseEther("100"));
      await token1.mint(addr1.address, parseEther("100"));
      await token2.mint(addr1.address, parseEther("100"));
      await token1.approve(fundManager.address, ethers.constants.MaxUint256);
      await token2.approve(fundManager.address, ethers.constants.MaxUint256);
   });

   describe("initialization", async () => {
      it("should set owner correctly", async () => {
         expect(await fundManager.owner()).to.equal(owner.address);
      });
      it("should revert on re-initialization", async () => {
         await expect(fundManager.initialize()).to.be.revertedWith(
            "Initializable: contract is already initialized"
         );
      });
   });

   describe("set Router", async () => {
      it("should fail if the caller is not authorized", async () => {
         await expect(
            fundManager.connect(addr1).setRouter(router.address)
         ).to.be.revertedWith("Ownable: caller is not the owner");
      });
      it("should fail if a zero address is passed", async () => {
         await expect(
            fundManager.setRouter(ethers.constants.AddressZero)
         ).to.be.revertedWith("BP: router requried");
      });
      it("should update router address successfully", async () => {
         await fundManager.setRouter(router.address);
         expect(await fundManager.router()).to.equal(router.address);
      });
   });

   describe("add Authorized Signer", async () => {
      it("should fail if the caller is not authorized", async () => {
         await expect(
            fundManager.connect(addr1).addSigner(signer.address)
         ).to.be.revertedWith("Ownable: caller is not the owner");
      });
      it("should fail if a zero address is passed", async () => {
         await expect(
            fundManager.addSigner(ethers.constants.AddressZero)
         ).to.be.revertedWith("Bad signer");
      });
      it("should add authorized signer successfully", async () => {
         await fundManager.addSigner(signer.address);
         expect(await fundManager.signers(signer.address)).to.be.true;
      });
   });

   describe("removeSigner", async () => {
      it("should revert if caller is not the owner", async () => {
         await expect(
            fundManager.connect(addr1).removeSigner(signer.address)
         ).to.be.revertedWith("Ownable: caller is not the owner");
      });
      it("should revert if a zero address is passed", async () => {
         await expect(
            fundManager.removeSigner(ethers.constants.AddressZero)
         ).to.be.revertedWith("Bad signer");
      });
      it("should remove signer correctly", async () => {
         await fundManager.removeSigner(signer.address);
         expect(await fundManager.signers(signer.address)).to.be.false;
      });
   });

   // describe("setFeeDistributor", async () => {
   //   it("should revert if caller is not the owner", async () => {
   //     await expect(
   //       fundManager.connect(addr1).setFeeDistributor(distributor.address)
   //     ).to.be.revertedWith("Ownable: caller is not the owner");
   //   });
   //   it("should add address as an fee distributor correctly", async () => {
   //     await fundManager.setFeeDistributor(distributor.address);
   //     expect(await fundManager.feeDistributor()).to.equal(distributor.address);
   //   });
   // });

   // describe("setFee", async () => {
   //   it("should revert if caller is not the admin", async () => {
   //     await expect(
   //       fundManager.connect(addr1).setFee(distributor.address, fee)
   //     ).to.be.revertedWith("WA: not admin");
   //   });
   //   it("should revert if a zero address is passed", async () => {
   //     await expect(
   //       fundManager.setFee(ethers.constants.AddressZero, fee)
   //     ).to.be.revertedWith("Bad token");
   //   });
   //   it("should revert if fee exceeds the limit", async () => {
   //     await expect(fundManager.setFee(token1.address, 1001)).to.be.revertedWith(
   //       "Fee too large"
   //     );
   //   });
   //   it("should set fee correctly", async () => {
   //     await fundManager.setFee(token1.address, fee);
   //     expect(await fundManager.fees(token1.address)).to.equal(fee);
   //   });
   // });

   describe("allowTarget", async () => {
      it("should revert if caller is not the admin", async () => {
         await expect(
            fundManager
               .connect(addr1)
               .allowTarget(addr3.address, networkId, addr3.address)
         ).to.be.revertedWith("WA: not admin");
      });
      it("should revert if a zero token address is passed", async () => {
         await expect(
            fundManager.allowTarget(
               ethers.constants.AddressZero,
               networkId,
               addr3.address
            )
         ).to.be.revertedWith("Bad token");
      });
      it("should revert if a zero target token address is passed", async () => {
         await expect(
            fundManager.allowTarget(
               addr3.address,
               networkId,
               ethers.constants.AddressZero
            )
         ).to.be.revertedWith("Bad targetToken");
      });
      it("should revert if a wrong chain ID is passed", async () => {
         await expect(
            fundManager.allowTarget(addr3.address, 0, addr3.address)
         ).to.be.revertedWith("Bad chainId");
      });
      it("should set token and target token addresses correctly", async () => {
         await fundManager.allowTarget(addr3.address, networkId, addr3.address);
         expect(
            await fundManager.allowedTargets(addr3.address, networkId)
         ).to.equal(addr3.address);
      });
   });

   describe("nonEvmAllowTarget", async () => {
      it("should revert if caller is not the admin", async () => {
         await expect(
            fundManager
               .connect(addr1)
               .nonEvmAllowTarget(addr3.address, networkId, addr3.address)
         ).to.be.revertedWith("WA: not admin");
      });
      it("should revert if a zero token address is passed", async () => {
         await expect(
            fundManager.nonEvmAllowTarget(
               ethers.constants.AddressZero,
               networkId,
               addr3.address
            )
         ).to.be.revertedWith("Bad token");
      });
      it("should set token and target token addresses correctly", async () => {
         await fundManager.nonEvmAllowTarget(
            addr3.address,
            networkId,
            addr3.address
         );
         expect(
            await fundManager.nonEvmAllowedTargets(addr3.address, networkId)
         ).to.equal(addr3.address);
      });
   });

   describe("disallowTarget", async () => {
      it("should revert if caller is not the admin", async () => {
         await expect(
            fundManager.connect(addr1).disallowTarget(addr3.address, networkId)
         ).to.be.revertedWith("WA: not admin");
      });
      it("should revert if a zero token address is passed", async () => {
         await expect(
            fundManager.disallowTarget(ethers.constants.AddressZero, networkId)
         ).to.be.revertedWith("Bad token");
      });
      it("should revert if a wrong chain ID is passed", async () => {
         await expect(
            fundManager.disallowTarget(addr3.address, 0)
         ).to.be.revertedWith("Bad chainId");
      });
      it("should disallow target correctly", async () => {
         await fundManager.disallowTarget(addr3.address, networkId);
         expect(
            await fundManager.allowedTargets(addr3.address, networkId)
         ).to.equal(ethers.constants.AddressZero);
      });
   });

   describe("nonEvmDisallowTarget", async () => {
      it("should revert if caller is not the admin", async () => {
         await expect(
            fundManager
               .connect(addr1)
               .nonEvmDisallowTarget(addr3.address, networkId)
         ).to.be.revertedWith("WA: not admin");
      });
      it("should revert if a zero token address is passed", async () => {
         await expect(
            fundManager.nonEvmDisallowTarget(
               ethers.constants.AddressZero,
               networkId
            )
         ).to.be.revertedWith("Bad token");
      });
      it("should disallow non-EVM target correctly", async () => {
         await fundManager.nonEvmDisallowTarget(addr3.address, networkId);
         expect(await fundManager.nonEvmAllowedTargets(addr3.address, networkId))
            .to.be.empty;
      });
   });

   describe("addFoundryAsset", async () => {
      it("should revert if caller is not the admin", async () => {
         await expect(
            fundManager.connect(addr1).addFoundryAsset(addr3.address)
         ).to.be.revertedWith("WA: not admin");
      });
      it("should revert if a zero token address is passed", async () => {
         await expect(
            fundManager.addFoundryAsset(ethers.constants.AddressZero)
         ).to.be.revertedWith("Bad token");
      });
      it("should add token as foundry asset correctly", async () => {
         await fundManager.addFoundryAsset(addr3.address);
         expect(await fundManager.isFoundryAsset(addr3.address)).to.be.true;
      });
   });

   describe("removeFoundryAsset", async () => {
      it("should revert if caller is not the admin", async () => {
         await expect(
            fundManager.connect(addr1).removeFoundryAsset(addr3.address)
         ).to.be.revertedWith("WA: not admin");
      });
      it("should revert if a zero token address is passed", async () => {
         await expect(
            fundManager.removeFoundryAsset(ethers.constants.AddressZero)
         ).to.be.revertedWith("Bad token");
      });
      it("should remove foundry asset correctly", async () => {
         await fundManager.removeFoundryAsset(addr3.address);
         expect(await fundManager.isFoundryAsset(addr3.address)).to.be.false;
      });
   });

   describe("swap | swapToAddress", async () => {
      it("should fail if caller is not the Router Contract", async () => {
         await expect(
            fundManager
               .connect(addr1)
               .swap(token1.address, parseEther("1"), networkId, token2.address)
         ).to.be.revertedWith("BP: Only router method");
         await expect(
            fundManager
               .connect(addr1)
               .swapToAddress(
                  token1.address,
                  parseEther("1"),
                  networkId,
                  token2.address,
                  owner.address
               )
         ).to.be.revertedWith("BP: Only router method");
         await fundManager.setRouter(owner.address);
      });
      it("should revert if a zero address is passed", async () => {
         await expect(
            fundManager.swap(
               ethers.constants.AddressZero,
               parseEther("1"),
               networkId,
               token2.address
            )
         ).to.be.revertedWith("BP: bad token");
      });
      it("should revert if a zero amount is passed", async () => {
         await expect(
            fundManager.swap(token1.address, 0, networkId, token2.address)
         ).to.be.revertedWith("BP: bad amount");
      });
      it("should revert if a zero network id is passed", async () => {
         await expect(
            fundManager.swap(token1.address, parseEther("1"), 0, token2.address)
         ).to.be.revertedWith("BP: targetNetwork is requried");
      });
      it("should revert if a zero token address is passed on target side", async () => {
         await expect(
            fundManager.swap(
               token1.address,
               parseEther("1"),
               networkId,
               ethers.constants.AddressZero
            )
         ).to.be.revertedWith("BP: bad target token");
      });
      it("should revert if a zero target account address is passed", async () => {
         await expect(
            fundManager.swapToAddress(
               token1.address,
               parseEther("1"),
               networkId,
               token2.address,
               ethers.constants.AddressZero
            )
         ).to.be.revertedWith("BridgePool: targetAddress is required");
      });
      it("should revert if target not allowed", async () => {
         await expect(
            fundManager.swap(
               token1.address,
               parseEther("1"),
               networkId,
               addr3.address
            )
         ).to.be.revertedWith("BP: target not allowed");
         await fundManager.allowTarget(token1.address, networkId, token2.address);
      });
      it("should swap correctly", async () => {
         preBalance = await token1.balanceOf(fundManager.address);
         tx = await fundManager.swap(
            token1.address,
            parseEther("1"),
            networkId,
            token2.address
         );
         expect(await token1.balanceOf(fundManager.address)).to.be.equal(
            preBalance.add(parseEther("1"))
         );
         await fundManager.swapToAddress(
            token1.address,
            parseEther("1"),
            networkId,
            token2.address,
            owner.address
         );
         expect(await token1.balanceOf(fundManager.address)).to.be.equal(
            preBalance.add(parseEther("2"))
         );
      });
      it("should catch event", async () => {
         await expect(tx)
            .to.emit(fundManager, "BridgeSwap")
            .withArgs(
               owner.address,
               token1.address,
               networkId,
               token2.address,
               owner.address,
               parseEther("1")
            );
      });
   });

   describe("nonEvmSwapToAddress", async () => {
      it("should revert if caller is not the router", async () => {
         await expect(
            fundManager
               .connect(addr1)
               .nonEvmSwapToAddress(
                  token1.address,
                  parseEther("1"),
                  networkId,
                  token2.address,
                  owner.address
               )
         ).to.be.revertedWith("BP: Only router method");
      });
      it("should revert if a zero token address is passed", async () => {
         await expect(
            fundManager.nonEvmSwapToAddress(
               ethers.constants.AddressZero,
               parseEther("1"),
               networkId,
               token2.address,
               owner.address
            )
         ).to.be.revertedWith("BP: bad token");
      });
      it("should revert if a zero amount is passed", async () => {
         await expect(
            fundManager.nonEvmSwapToAddress(
               token1.address,
               0,
               networkId,
               token2.address,
               owner.address
            )
         ).to.be.revertedWith("BP: bad amount");
      });
      it("should revert if target not allowed", async () => {
         await expect(
            fundManager.nonEvmSwapToAddress(
               token1.address,
               parseEther("1"),
               networkId,
               token2.address,
               owner.address
            )
         ).to.be.revertedWith("BP: target not allowed");
         await fundManager.nonEvmAllowTarget(
            token1.address,
            networkId,
            token2.address
         );
      });
      it("should perform non-EVM swap correctly", async () => {
         preBalance = await token1.balanceOf(fundManager.address);
         tx = await fundManager.nonEvmSwapToAddress(
            token1.address,
            parseEther("1"),
            networkId,
            token2.address,
            owner.address
         );
         expect(await token1.balanceOf(fundManager.address)).to.be.equal(
            preBalance.add(parseEther("1"))
         );
      });
      it("should catch event", async () => {
         await expect(tx)
            .to.emit(fundManager, "nonEvmBridgeSwap")
            .withArgs(
               owner.address,
               token1.address,
               networkId,
               token2.address,
               owner.address,
               parseEther("1")
            );
      });
   });

   describe("withdrawSigned", async () => {
      before("setup", async () => {
         const web3 = new Web3();
         const ds = domainSeparator(
            web3.eth,
            NAME,
            VERSION,
            hardhatConfig.networks.hardhat.chainId,
            fundManager.address
         );
         const hash = signatureHash(
            web3,
            token1.address,
            owner.address,
            parseEther("1"),
            salt,
            ds
         );
         const privateKey =
            "0x74e48540eca3db52ed5ff1bf3603750d89d1349698319323e52c7cec90c07f47";
         account = web3.eth.accounts.privateKeyToAccount(privateKey);
         const sigP = ecsign(
            Buffer.from(hash.replace("0x", ""), "hex"),
            Buffer.from(privateKey.replace("0x", ""), "hex")
         );
         signature = fixSig(toRpcSig(sigP.v, sigP.r, sigP.s));
      });

      it("should revert if caller is not the Router", async () => {
         await expect(
            fundManager
               .connect(addr1)
               .withdrawSigned(
                  token1.address,
                  owner.address,
                  parseEther("1"),
                  salt,
                  signature
               )
         ).to.be.revertedWith("BP: Only router method");
      });
      it("should revert if a zero token address is passed", async () => {
         await expect(
            fundManager.withdrawSigned(
               ethers.constants.AddressZero,
               owner.address,
               parseEther("1"),
               salt,
               signature
            )
         ).to.be.revertedWith("BP: bad token");
      });
      it("should revert if a zero payee address is passed", async () => {
         await expect(
            fundManager.withdrawSigned(
               token1.address,
               ethers.constants.AddressZero,
               parseEther("1"),
               salt,
               signature
            )
         ).to.be.revertedWith("BP: bad payee");
      });
      it("should revert if a zero salt is passed", async () => {
         await expect(
            fundManager.withdrawSigned(
               token1.address,
               owner.address,
               parseEther("1"),
               ethers.constants.HashZero,
               signature
            )
         ).to.be.revertedWith("BP: bad salt");
      });
      it("should revert if a zero amount is passed", async () => {
         await expect(
            fundManager.withdrawSigned(
               token1.address,
               owner.address,
               0,
               salt,
               signature
            )
         ).to.be.revertedWith("BP: bad amount");
      });
      it("should revert if message signer is not approved", async () => {
         await expect(
            fundManager.withdrawSigned(
               token1.address,
               owner.address,
               parseEther("1"),
               salt,
               signature
            )
         ).to.be.revertedWith("BridgePool: Invalid signer");

         it("should withdraw with signature verifycation correctly", async () => {
            await fundManager.addSigner(account.address);
            preBalance = BigNumber.from(await token1.balanceOf(owner.address));
            tx = await fundManager.withdrawSigned(token1.address, owner.address, parseEther("1"), salt, signature);
            postBalance = BigNumber.from(await token1.balanceOf(owner.address));
            expect(postBalance.sub(preBalance)).to.equal(parseEther("0.9"));// 1 ETH - 10% fee
         });
         it("should transfer fee to distributor contract correctly", async () => {
            expect(await token1.balanceOf(distributor.address)).to.equal(parseEther("0.1"));// 1 ETH * 10% fee
         });
         it("should catch event", async () => {
            feeAmount = parseEther("1").mul(fee).div(10000);
            await expect(tx)
               .to.emit(fundManager, "TransferBySignature")
               .withArgs(
                  account.address,
                  owner.address,
                  token1.address,
                  parseEther("0.9"), // 1 ETH - 10% fee
                  feeAmount
               );

         });
      });
   });

   describe("withdrawSignedVerify", async () => {
      it("should return signer's address correctly", async () => {
         const web3 = new Web3();
         const ds = domainSeparator(
            web3.eth,
            NAME,
            VERSION,
            hardhatConfig.networks.hardhat.chainId,
            fundManager.address
         );
         const hash = signatureHash(
            web3,
            token1.address,
            owner.address,
            parseEther("1"),
            salt,
            ds
         );
         const privateKey =
            "0x74e48540eca3db52ed5ff1bf3603750d89d1349698319323e52c7cec90c07f47";
         account = web3.eth.accounts.privateKeyToAccount(privateKey);
         const sigP = ecsign(
            Buffer.from(hash.replace("0x", ""), "hex"),
            Buffer.from(privateKey.replace("0x", ""), "hex")
         );
         signature = fixSig(toRpcSig(sigP.v, sigP.r, sigP.s));
         result = await fundManager.withdrawSignedVerify(
            token1.address,
            owner.address,
            parseEther("1"),
            salt,
            signature
         );
         expect(result[1]).to.equal(account.address);
      });
   });

   describe("addLiquidity", async () => {
      it("should revert if an invalid amount is passed", async () => {
         await expect(
            fundManager.addLiquidity(token1.address, 0)
         ).to.be.revertedWith("Amount must be positive");
      });
      it("should revert if an invalid token address is passed", async () => {
         await expect(
            fundManager.addLiquidity(ethers.constants.AddressZero, parseEther("1"))
         ).to.be.revertedWith("Bad token");
      });
      it("should revert if token is not a supported foundry asset", async () => {
         await expect(
            fundManager.addLiquidity(token2.address, parseEther("1"))
         ).to.be.revertedWith("Only foundry assets can be added");
      });
      it("should increase liquidity correctly", async () => {
         await fundManager.addFoundryAsset(token1.address);
         expect(
            await fundManager.liquidity(token1.address, owner.address)
         ).to.equal(0);
         tx = await fundManager.addLiquidity(token1.address, parseEther("10"));
         expect(
            await fundManager.liquidity(token1.address, owner.address)
         ).to.equal(parseEther("10"));
      });
      it("should emit BridgeLiquidityAdded event", async () => {
         await expect(tx)
            .to.emit(fundManager, "BridgeLiquidityAdded")
            .withArgs(owner.address, token1.address, parseEther("10"));
      });
   });

   describe("removeLiquidityIfPossible", async () => {
      it("should revert if a zero amount is passed", async () => {
         await expect(
            fundManager.removeLiquidityIfPossible(token1.address, 0)
         ).to.be.revertedWith("Amount must be positive");
      });
      it("should revert if a zero token address is passed", async () => {
         await expect(
            fundManager.removeLiquidityIfPossible(
               ethers.constants.AddressZero,
               parseEther("1")
            )
         ).to.be.revertedWith("Bad token");
      });
      it("should revert if token is not a foundry asset", async () => {
         await expect(
            fundManager.removeLiquidityIfPossible(token2.address, parseEther("1"))
         ).to.be.revertedWith("Only foundry assets can be removed");
      });
      it("should revert if amount exceeds the liquidity on the contract", async () => {
         await expect(
            fundManager.removeLiquidityIfPossible(token1.address, parseEther("100"))
         ).to.be.revertedWith("Not enough liquidity");
      });
      it("should decrease liquidity correctly", async () => {
         await fundManager.addFoundryAsset(token1.address);
         expect(
            await fundManager.liquidity(token1.address, owner.address)
         ).to.equal(parseEther("10"));
         tx = await fundManager.removeLiquidityIfPossible(
            token1.address,
            parseEther("10")
         );
         expect(
            await fundManager.liquidity(token1.address, owner.address)
         ).to.equal(0);
      });
      it("should catch event", async () => {
         await expect(tx)
            .to.emit(fundManager, "BridgeLiquidityRemoved")
            .withArgs(owner.address, token1.address, parseEther("10"));
      });
   });
});

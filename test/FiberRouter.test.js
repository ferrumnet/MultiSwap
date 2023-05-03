const { expect } = require("chai");
const { ethers } = require("hardhat");
const { parseEther } = require("ethers/lib/utils");
const { BigNumber } = require("ethers");
const Web3 = require("web3");
const { domainSeparator, fixSig } = require("../scripts/utils/BridgeUtils");
const hardhatConfig = require("../hardhat.config");
const { ecsign, toRpcSig } = require("ethereumjs-util");

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

describe("initialize", function () {
  let fiberRouter;
  before("setup", async () => {
    [owner] =
      await ethers.getSigners();

    const FiberRouter = await ethers.getContractFactory("FiberRouter");
    fiberRouter = await FiberRouter.deploy();
  });

  it("should initialize the contract", async function () {
    await fiberRouter.connect(owner).initialize();
    expect(await fiberRouter.owner()).to.equal(owner.address);
  });
});

describe("setOracle", function () {
  let fundManager;
  let fiberRouter;
  before("setup", async () => {
    [owner, addr1, addr2, addr3, addr4, signer, router, ...addrs] =
      await ethers.getSigners();

    const FiberRouter = await ethers.getContractFactory("FiberRouter");
    fiberRouter = await FiberRouter.deploy();
    await fiberRouter.connect(owner).initialize();
    tokenFactory = await ethers.getContractFactory("MockToken");
    token1 = await tokenFactory.connect(owner).deploy();
  });
  it("should set the oracle address", async function () {
    await fiberRouter.connect(owner).setOracle(token1.address, owner.address);
    expect(await fiberRouter.priceFeed(token1.address)).to.equal(owner.address);
  });

  it("should revert when called by non-owner", async function () {
    await expect(fiberRouter.connect(addr1).setOracle(token1.address, owner.address)).to.be.revertedWith("Ownable: caller is not the owner");
  });
});

describe("setPool", function () {
  let fundManager;
  let fiberRouter;
  before("setup", async () => {
    [owner, addr1, addr2, addr3, addr4, signer, router, ...addrs] =
      await ethers.getSigners();

    const FiberRouter = await ethers.getContractFactory("FiberRouter");
    fiberRouter = await FiberRouter.deploy();
    const FundManager = await ethers.getContractFactory("FundManager");
    fundManager = await FundManager.connect(owner).deploy();
    await fiberRouter.connect(owner).initialize();
    await fundManager.connect(owner).initialize();
    await fiberRouter.connect(owner).setPool(fundManager.address);
    await fundManager.connect(owner).setRouter(fiberRouter.address)

    // distributoFactory = await ethers.getContractFactory("GeneralTaxDistributor");
    // distributor = await distributoFactory.connect(owner).deploy();

    tokenFactory = await ethers.getContractFactory("MockToken");
    token1 = await tokenFactory.connect(owner).deploy();
    token2 = await tokenFactory.connect(owner).deploy();

    // fmFactory = await ethers.getContractFactory("FundManager");
    // fundManager = await fmFactory.connect(owner).deploy();

    await token1.mint(owner.address, parseEther("100"));
    await token2.mint(owner.address, parseEther("100"));
    await token1.mint(addr1.address, parseEther("100"));
    await token2.mint(addr1.address, parseEther("100"));
    await token1.approve(fundManager.address, ethers.constants.MaxUint256);
    await token2.approve(fundManager.address, ethers.constants.MaxUint256);
  });

  it('sets the pool address correctly', async () => {
    await fiberRouter.connect(owner).setPool(fundManager.address);
    const poolAddress = await fiberRouter.pool();
    expect(await poolAddress).to.equal(fundManager.address);
  })
  it("should revert if caller is not the admin", async () => {
    await expect(
      fiberRouter.connect(addr1).setPool(fundManager.address)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });
});

describe("Swap", function () {
  const chainId1 = 123
  let token;
  let fundManager;
  let fiberRouter;

  before("setup", async () => {
    [owner, addr1, addr2, addr3, addr4, signer, router, ...addrs] =
      await ethers.getSigners();

    const FiberRouter = await ethers.getContractFactory("FiberRouter");
    fiberRouter = await FiberRouter.deploy();
    const FundManager = await ethers.getContractFactory("FundManager");
    fundManager = await FundManager.connect(owner).deploy();
    await fiberRouter.connect(owner).initialize();
    await fundManager.connect(owner).initialize();
    await fiberRouter.connect(owner).setPool(fundManager.address);
    await fundManager.connect(owner).setRouter(fiberRouter.address)

    tokenFactory = await ethers.getContractFactory("MockToken");
    token1 = await tokenFactory.connect(owner).deploy();
    token2 = await tokenFactory.connect(owner).deploy();

    await token1.mint(owner.address, parseEther("100"));
    await token2.mint(owner.address, parseEther("100"));
    await token1.mint(addr1.address, parseEther("100"));
    await token2.mint(addr1.address, parseEther("100"));
    await token1.approve(fundManager.address, ethers.constants.MaxUint256);
    await token2.approve(fundManager.address, ethers.constants.MaxUint256);
  });

  it("should revert if caller is not the router", async () => {
    await expect(
      fundManager
        .connect(addr1)
        .swap(token1.address, parseEther("1"), chainId1, token2.address)
    ).to.be.revertedWith("BP: Only router method");
  });
  it("should revert if a zero amount is passed", async () => {
    await expect(
      fiberRouter.swap(token1.address, 0, chainId1, token2.address, owner.address)
    ).to.be.revertedWith("BP: bad amount");
  });

  it('Foundry Asset Swap', async () => {
    await fundManager.connect(owner).allowTarget(token1.address, chainId1, token2.address);
    await
      token1.approve(fiberRouter.address, parseEther("10"));
    await fiberRouter.connect(owner)
      .swap(
        token1.address,
        parseEther("1"),
        chainId1,
        token2.address,
        owner.address,
      );
  })
});

describe("nonEvmSwap", function () {
  let fundManager;
  let fiberRouter;
  let token1
  before("setup", async () => {
    [owner, addr1, addr2, addr3, addr4, signer, router, ...addrs] =
      await ethers.getSigners();

    const FiberRouter = await ethers.getContractFactory("FiberRouter");
    fiberRouter = await FiberRouter.deploy();
    const FundManager = await ethers.getContractFactory("FundManager");
    fundManager = await FundManager.connect(owner).deploy();
    await fiberRouter.connect(owner).initialize();
    await fundManager.connect(owner).initialize();
    await fiberRouter.connect(owner).setPool(fundManager.address);
    await fundManager.connect(owner).setRouter(fiberRouter.address)

    tokenFactory = await ethers.getContractFactory("MockToken");
    token1 = await tokenFactory.connect(owner).deploy();

    await token1.mint(owner.address, parseEther("100"));
    await token1.mint(addr1.address, parseEther("100"));
    await token1.approve(fundManager.address, ethers.constants.MaxUint256);
  });

  it('Foundry Asset Non Evm Swap', async () => {
    const nonEvmAddress = "cudos1q82hgcy5sdcn3xlqvlq96urn72pap8ph6vcmpl"
    const nonEvmChainId = "cudos-1";
    const nonEvmToken = "acudos"
    await fundManager.connect(owner).nonEvmAllowTarget(token1.address, nonEvmChainId, nonEvmToken);
    await token1.approve(fiberRouter.address, parseEther("10"));
    await fiberRouter
      .nonEvmSwap(
        token1.address,
        parseEther("1"),
        nonEvmChainId,
        nonEvmToken,
        nonEvmAddress,
      );
  })
})

describe("withdrawSigned", async () => {
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

    const FiberRouter = await ethers.getContractFactory("FiberRouter");
    fiberRouter = await FiberRouter.deploy();
    const FundManager = await ethers.getContractFactory("FundManager");
    fundManager = await FundManager.connect(owner).deploy();
    await fiberRouter.connect(owner).initialize();
    await fundManager.connect(owner).initialize();
    await fiberRouter.connect(owner).setPool(fundManager.address);
    await fundManager.connect(owner).setRouter(fiberRouter.address)

    tokenFactory = await ethers.getContractFactory("MockToken");
    token1 = await tokenFactory.connect(owner).deploy();
    token2 = await tokenFactory.connect(owner).deploy();

    await token1.mint(owner.address, parseEther("100"));
    await token2.mint(owner.address, parseEther("100"));
    await token1.mint(addr1.address, parseEther("100"));
    await token2.mint(addr1.address, parseEther("100"));
    await token1.approve(fundManager.address, ethers.constants.MaxUint256);
    await token2.approve(fundManager.address, ethers.constants.MaxUint256);

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
      fiberRouter.withdrawSigned(
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
      fiberRouter.withdrawSigned(
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
      fiberRouter.withdrawSigned(
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
      fiberRouter.withdrawSigned(
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
      fiberRouter.withdrawSigned(
        token1.address,
        owner.address,
        parseEther("1"),
        salt,
        signature
      )
    ).to.be.revertedWith("BridgePool: Invalid signer");
  });
  it("should withdraw with signature verifycation correctly", async () => {
    await fundManager.addSigner(account.address);
    preBalance = BigNumber.from(await token1.balanceOf(owner.address));
    await token1.transfer(fundManager.address, parseEther("11"))
    await fiberRouter.withdrawSigned(
      token1.address,
      owner.address,
      parseEther("1"),
      salt,
      signature
    );
  });
});
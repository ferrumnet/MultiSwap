// run in a separate terminal
// ganache-cli --fork https://goerli.infura.io/v3/<YOUR‑API‑KEY> --chainId 5
const { ethers } = require("hardhat");
const { expect } = require("chai");
const { BigNumber } = require("ethers")
const Web3 = require("web3");
const { parseEther } = require("ethers/lib/utils");
const { ecsign, toRpcSig } = require("ethereumjs-util");
const { networks, goerliChainId } = require("../Network");
const { domainSeparator, fixSig } = require("../scripts/utils/BridgeUtils");
const wethAbi = require("../artifacts/contracts/common/uniswap/IWETH.sol/IWETH.json");
const erc20Abi = require("../artifacts/contracts/token/ERC20.sol/ERC20.json").abi;
const hardhatConfig = require("../hardhat.config");

function signatureHash(web3, token, payee, amount, salt, ds) {
  const methodHash = Web3.utils.keccak256(
    Web3.utils.utf8ToHex('WithdrawSigned(address token,address payee,uint256 amount,bytes32 salt)'));
  const params = ['bytes32', 'address', 'address', 'uint256', 'bytes32'];
  const structure = web3.eth.abi.encodeParameters(params, [methodHash, token, payee, amount, salt]);
  const structureHash = Web3.utils.keccak256(structure);
  return Web3.utils.soliditySha3("\x19\x01", ds, structureHash);
}

describe("FiberRouter", async () => {

  const NAME = "FUND MANAGER";
  const VERSION = "000.004";
  const provider = new ethers.providers.JsonRpcProvider("https://rpc.ankr.com/eth_goerli");
  const aggregatorV3InterfaceABI = [
    {
      inputs: [],
      name: "decimals",
      outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "description",
      outputs: [{ internalType: "string", name: "", type: "string" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint80", name: "_roundId", type: "uint80" }],
      name: "getRoundData",
      outputs: [
        { internalType: "uint80", name: "roundId", type: "uint80" },
        { internalType: "int256", name: "answer", type: "int256" },
        { internalType: "uint256", name: "startedAt", type: "uint256" },
        { internalType: "uint256", name: "updatedAt", type: "uint256" },
        { internalType: "uint80", name: "answeredInRound", type: "uint80" },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "latestRoundData",
      outputs: [
        { internalType: "uint80", name: "roundId", type: "uint80" },
        { internalType: "int256", name: "answer", type: "int256" },
        { internalType: "uint256", name: "startedAt", type: "uint256" },
        { internalType: "uint256", name: "updatedAt", type: "uint256" },
        { internalType: "uint80", name: "answeredInRound", type: "uint80" },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "version",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
  ];
  const goerliOracle = "0xAb5c49580294Aff77670F839ea425f5b78ab3Ae7";
  const networkId = goerliChainId;
  const baseDecimals = "8";
  const salt = ethers.utils.formatBytes32String("1234");
  let tx;
  let signature;
  let weth;

  before("setup", async () => {
    [owner, addr1, addr2, addr3, addr4, signer, router, ...addrs] =
      await ethers.getSigners();

    uniswapRouter = networks[goerliChainId].dexContract;

    tokenFactory = await ethers.getContractFactory("MockToken");
    token1 = await tokenFactory.connect(owner).deploy();
    token2 = await tokenFactory.connect(owner).deploy();

    fmFactory = await ethers.getContractFactory("FundManager");
    fundManager = await fmFactory.connect(owner).deploy();
    await fundManager.initialize();

    frFactory = await ethers.getContractFactory("FiberRouter");
    fiberRouter = await frFactory.connect(owner).deploy();
    await fiberRouter.initialize();
    await fundManager.setRouter(fiberRouter.address);
    await fundManager.allowTarget(token1.address, networkId, token2.address);

    oracle = new ethers.Contract(goerliOracle, aggregatorV3InterfaceABI, provider);

    await token1.mint(owner.address, parseEther("100"));
    await token2.mint(owner.address, parseEther("100"));
    await token1.mint(addr1.address, parseEther("100"));
    await token2.mint(addr1.address, parseEther("100"));
    await token1.approve(fiberRouter.address, ethers.constants.MaxUint256);
    await token1.approve(fundManager.address, ethers.constants.MaxUint256);
    await token2.approve(fiberRouter.address, ethers.constants.MaxUint256);
    await token2.approve(fundManager.address, ethers.constants.MaxUint256);
  });

  describe("initialization", async () => {
    it("should set owner correctly", async () => {
      expect(await fiberRouter.owner()).to.equal(owner.address);
    });
    it("should revert on re-initialization", async () => {
      await expect(fiberRouter.initialize())
        .to.be.revertedWith("Initializable: contract is already initialized");
    });
  });

  describe("setPool", async () => {
    it("should revert if caller is not the owner", async () => {
      await expect(fiberRouter.connect(addr1).setPool(fundManager.address))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
    it("should set fund manager address correctly", async () => {
      await fiberRouter.setPool(fundManager.address);
      expect(await fiberRouter.pool()).to.equal(fundManager.address);
    });
  });

  describe("setOracle", async () => {
    it("should revert if caller is not the owner", async () => {
      await expect(fiberRouter.connect(addr1).setOracle(token1.address, oracle.address))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
    it("should set oracle address correctly", async () => {
      await fiberRouter.setOracle(token1.address, goerliOracle);
      expect(await fiberRouter.priceFeed(token1.address)).to.equal(goerliOracle);
    });
  });

  describe("getFoundryTokenPrice", async () => {
    it("should return foundry token price correctly", async () => {
      price = BigNumber.from((await oracle.latestRoundData()).answer).mul(10 ** (18 - baseDecimals));
      expect(await fiberRouter.getFoundryTokenPrice(token1.address)).to.equal(price);
    });
  });

  describe("swap", async () => {
    it("should swap correctly", async () => {
      tx = await fiberRouter.swap(token1.address, parseEther("1"), networkId, token2.address, owner.address);
      const event = await tx.wait()
    });
    it("should catch event", async () => {
      await expect(tx)
        .to.emit(fiberRouter, "Swap")
        .withArgs(
          token1.address,
          token2.address,
          hardhatConfig.networks.hardhat.chainId,
          5,
          parseEther("1"),
          owner.address,
          owner.address,
        );
    });
  });

  describe("nonEvmSwap", async () => {
    it("should perform non-EVM swap correctly", async () => {
      await fundManager.nonEvmAllowTarget(token1.address, networkId, token2.address);
      tx = await fiberRouter.nonEvmSwap(token1.address, parseEther("1"), networkId, token2.address, owner.address);
    });
  });

  describe("swapAndCross", async () => {
    it("should cross swap correctly", async () => {
      tokenAAddress = "0xE82F1AbE0C2d01c6df23D276AE337A5ae2599a66";
      tokenBAddress = "0x7c87561b129f46998fc9Afb53F98b7fdaB68696f";
      tokenA = new ethers.Contract(
        tokenAAddress,
        [{ "inputs": [{ "internalType": "string", "name": "name_", "type": "string" }, { "internalType": "string", "name": "symbol_", "type": "string" }], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "spender", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Transfer", "type": "event" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" }], "name": "allowance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "approve", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "subtractedValue", "type": "uint256" }], "name": "decreaseAllowance", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "addedValue", "type": "uint256" }], "name": "increaseAllowance", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "amt", "type": "uint256" }], "name": "mint", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "name", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "symbol", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "totalSupply", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "transfer", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "transferFrom", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }],
        provider
      );
      tokenB = new ethers.Contract(
        tokenBAddress,
        [{ "inputs": [{ "internalType": "uint256", "name": "d", "type": "uint256" }], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "spender", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Transfer", "type": "event" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" }], "name": "allowance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "approve", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "subtractedValue", "type": "uint256" }], "name": "decreaseAllowance", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "addedValue", "type": "uint256" }], "name": "increaseAllowance", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "mint", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "name", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "symbol", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "totalSupply", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "transfer", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "transferFrom", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }],
        provider
      );
      weth = new ethers.Contract(
        "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
        wethAbi.abi,
        provider
      );
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: ["0x2468bA6BC6C22A8F25867b490EEb3CfB32C4FDb3"],
      });
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: ["0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6"],
      });
      x = await ethers.getSigner("0x2468bA6BC6C22A8F25867b490EEb3CfB32C4FDb3");
      wethHolder = await ethers.getSigner("0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6");
      await weth.connect(wethHolder).transfer(x.address, parseEther("20"));
      await weth.connect(wethHolder).approve(x.address, ethers.constants.MaxUint256);
      await weth.connect(wethHolder).transfer(fundManager.address, parseEther("10"));
      await weth.connect(wethHolder).approve(fundManager.address, ethers.constants.MaxUint256);
      await tokenA.connect(x).mint(x.address, parseEther("100"));
      await tokenB.connect(x).mint(x.address, parseEther("100"));
      currentDate = new Date();
      deadLine = currentDate.getTime() + 20 * 60000;
      await weth.connect(x).approve(fiberRouter.address, ethers.constants.MaxUint256);
      await weth.connect(x).approve(uniswapRouter.address, ethers.constants.MaxUint256);
      await tokenA.connect(x).approve(fiberRouter.address, ethers.constants.MaxUint256);
      await tokenB.connect(x).approve(fiberRouter.address, ethers.constants.MaxUint256);
      await tokenA.connect(x).approve(uniswapRouter.address, ethers.constants.MaxUint256);
      await tokenB.connect(x).approve(uniswapRouter.address, ethers.constants.MaxUint256);
      await uniswapRouter.connect(x).addLiquidity(tokenA.address, tokenB.address, parseEther("10"), parseEther("10"), 0, 0, owner.address, deadLine);
      await fundManager.allowTarget(tokenA.address, networkId, tokenB.address);
      await fundManager.allowTarget(tokenB.address, networkId, tokenB.address);
      await fundManager.nonEvmAllowTarget(tokenB.address, networkId, tokenB.address);
      await fiberRouter.connect(x).swapAndCross(
        uniswapRouter.address,
        parseEther("0.1"),
        1,
        [tokenA.address, tokenB.address],
        deadLine,
        networkId,
        tokenB.address,
        x.address
      );
      await fiberRouter.connect(x).nonEvmSwapAndCross(
        uniswapRouter.address,
        parseEther("0.1"),
        1,
        [tokenA.address, tokenB.address],
        deadLine,
        networkId,
        tokenB.address,
        x.address
      );
      await expect(fiberRouter.connect(x).swapAndCrossETH(
        uniswapRouter.address,
        1,
        [tokenA.address, tokenB.address],
        deadLine,
        networkId,
        tokenB.address,
        x.address,
        { value: parseEther("0.1") }
      )).to.be.reverted;
    });
  });

  describe("withdrawSigned", async () => {
    it("should withdraw with signature verifycation correctly", async () => {
      const web3 = new Web3();
      const ds = domainSeparator(
        web3.eth,
        NAME,
        VERSION,
        hardhatConfig.networks.hardhat.chainId,
        fundManager.address
      );
      const hash = signatureHash(web3, tokenA.address, owner.address, parseEther("1"), salt, ds);
      const privateKey = "0x74e48540eca3db52ed5dd1bf3603750d89d1349698319323e52c7cec90c07f47";
      account = web3.eth.accounts.privateKeyToAccount(privateKey);
      await fundManager.addSigner(account.address);
      await tokenA.connect(x).mint(fundManager.address, parseEther("100"));
      const sigP = ecsign(
        Buffer.from(hash.replace('0x', ''), 'hex'),
        Buffer.from(privateKey.replace('0x', ''), 'hex')
      );
      signature = fixSig(toRpcSig(sigP.v, sigP.r, sigP.s));
      await fiberRouter.withdrawSigned(tokenA.address, owner.address, parseEther("1"), salt, signature);
    });
  });

  describe("withdrawSignedAndSwapToFoundry", async () => {
    it("should withdraw foundry token correctly", async () => {
      const web3 = new Web3();
      const ds = domainSeparator(
        web3.eth,
        NAME,
        VERSION,
        hardhatConfig.networks.hardhat.chainId,
        fundManager.address
      );
      const hash = signatureHash(web3, tokenA.address, owner.address, parseEther("0.1"), salt, ds);
      const privateKey = "0x74e48540eca3db52ed5dd1bf3603750d89d1349698319323e52c7cec90c07f47";
      account = web3.eth.accounts.privateKeyToAccount(privateKey);
      const sigP = ecsign(
        Buffer.from(hash.replace('0x', ''), 'hex'),
        Buffer.from(privateKey.replace('0x', ''), 'hex')
      );
      signature = fixSig(toRpcSig(sigP.v, sigP.r, sigP.s));
      await fiberRouter.setOracle(tokenA.address, goerliOracle);
      await fiberRouter.withdrawSignedAndSwapToFoundry(tokenA.address, tokenA.address, owner.address, parseEther("0.1"), salt, signature);
    });
  });

  describe("withdrawSignedAndSwap", async () => {
    it("should revert if an empty array is passed", async () => {
      await expect(fiberRouter.withdrawSignedAndSwap(
        fiberRouter.address,
        uniswapRouter.address,
        parseEther("0.1"),
        0,
        [],
        0,
        salt,
        signature
      )).to.be.revertedWith("BR: path too short")
    });
    it("should withdraw and swap correctly", async () => {
      const web3 = new Web3();
      const ds = domainSeparator(
        web3.eth,
        NAME,
        VERSION,
        hardhatConfig.networks.hardhat.chainId,
        fundManager.address
      );
      const hash = signatureHash(web3, tokenA.address, fiberRouter.address, parseEther("0.1"), salt, ds);
      const privateKey = "0x74e48540eca3db52ed5dd1bf3603750d89d1349698319323e52c7cec90c07f47";
      account = web3.eth.accounts.privateKeyToAccount(privateKey);
      const sigP = ecsign(
        Buffer.from(hash.replace('0x', ''), 'hex'),
        Buffer.from(privateKey.replace('0x', ''), 'hex')
      );
      signature = fixSig(toRpcSig(sigP.v, sigP.r, sigP.s));
      currentDate = new Date();
      deadLine = currentDate.getTime() + 20 * 60000;
      await fiberRouter.withdrawSignedAndSwap(
        fiberRouter.address,
        uniswapRouter.address,
        parseEther("0.1"),
        0,
        [tokenA.address, tokenB.address],
        deadLine,
        salt,
        signature
      );
    });
  });

  describe("withdrawSignedAndSwapETH", async () => {
    it("should withdraw and swap correctly", async () => {
      uno = new ethers.Contract(
        "0x094161BA1A12C37f5398472D935c3AE9dc89C3c0",
        erc20Abi,
        provider
      );
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: ["0x5ACCa90B4E5CF2D283cd0B5bFf9dC1CeA51E0Bf0"],
      });
      unoHolder = await ethers.getSigner("0x5ACCa90B4E5CF2D283cd0B5bFf9dC1CeA51E0Bf0");
      const web3 = new Web3();
      const ds = domainSeparator(
        web3.eth,
        NAME,
        VERSION,
        hardhatConfig.networks.hardhat.chainId,
        fundManager.address
      );
      const hash = signatureHash(web3, "0x094161BA1A12C37f5398472D935c3AE9dc89C3c0", fiberRouter.address, parseEther("0.11"), salt, ds);
      const privateKey = "0x74e48540eca3db52ed5dd1bf3603750d89d1349698319323e52c7cec90c07f47";
      account = web3.eth.accounts.privateKeyToAccount(privateKey);
      const sigP = ecsign(
        Buffer.from(hash.replace('0x', ''), 'hex'),
        Buffer.from(privateKey.replace('0x', ''), 'hex')
      );
      signature = fixSig(toRpcSig(sigP.v, sigP.r, sigP.s));
      currentDate = new Date();
      deadLine = currentDate.getTime() + 20 * 60000;
      await uno.connect(unoHolder).transfer(fundManager.address, parseEther("10"));
      await expect(fiberRouter.withdrawSignedAndSwapETH(
        fiberRouter.address,
        uniswapRouter.address,
        parseEther("0.11"),
        0,
        [uno.address, weth.address],
        deadLine,
        salt,
        signature
      )).to.be.reverted;
    });
  });
})

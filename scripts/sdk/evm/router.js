const { ethers } = require("ethers");
require("dotenv").config();
const fiberRouterAbi = require("../../../artifacts/contracts/upgradeable-Bridge/FiberRouter.sol/FiberRouter.json");
const tokenAbi = require("../../../artifacts/contracts/token/Token.sol/Token.json");

class FIBERRouterContract {
  constructor(contract, rpcEndpoint, privKey) {
    this.contract = contract;
    this.rpcEndpoint = rpcEndpoint;
    this.privKey = privKey;
  }
  async getConnectedWallet() {
    const provider = new ethers.providers.JsonRpcProvider(this.rpcEndpoint);
    const signer = new ethers.Wallet(this.privKey).connect(provider);
    return signer.address;
  }

  async owner() {
    // TODO:
  }

  async pool() {
    // TODO:
  }

  // admin function
  async transferOwnership(new_owner) {
    // TODO:
  }

  // admin function
  async setPool(pool) {}
  async swap(
    sourceToken,
    sourceAmount,
    targetChainId,
    targetTokenAddress,
    targetAddress
  ) {
    const provider = new ethers.providers.JsonRpcProvider(this.rpcEndpoint);
    const signer = new ethers.Wallet(this.privKey).connect(provider);

    const sourceTokenContract = new ethers.Contract(
      sourceToken,
      tokenAbi.abi,
      provider
    );
    const approveRes = await sourceTokenContract
      .connect(signer)
      .approve(this.contract, sourceAmount);
    await approveRes.wait();

    const fiberRouterContract = new ethers.Contract(
      this.contract,
      fiberRouterAbi.abi,
      provider
    );

    // TODO: use dummy address if target token is not evm chain - should have mapping
    console.log(
      "Replacing token and address to evm compatible address ...",
      targetTokenAddress,
      targetAddress
    );
    const hexAddrMapping = {
      acudos: "0x34e93782447c34C1526f4A2C2c30B54178289d90",
    };
    targetTokenAddress =
      hexAddrMapping[targetTokenAddress] || targetTokenAddress;

    console.log(
      "Replaced token and addresses ...",
      targetTokenAddress,
      targetAddress
    );

    const result = await fiberRouterContract
      .connect(signer)
      .swap(
        sourceToken,
        sourceAmount,
        targetChainId,
        targetTokenAddress,
        targetAddress,
        { gasLimit: 1000000 }
      );

    const receipt = await result.wait();
    if (receipt.status == 1) {
      return true;
    }
    return false;
  }

  async withdrawSigned(token, user, amount, salt, signature) {
    // TODO:
  }

  async withdraw(token, user, amount) {
    // TODO:
  }

  async withdrawAndSwapToFoundry(
    targetFoundryTokenAddress,
    targetTokenAddress,
    amount
  ) {
    const provider = new ethers.providers.JsonRpcProvider(this.rpcEndpoint);
    const fiberRouterContract = new ethers.Contract(
      this.contract,
      fiberRouterAbi.abi,
      provider
    );
    const signer = new ethers.Wallet(this.privKey).connect(provider);
    const result = await fiberRouterContract
      .connect(signer)
      .withdrawAndSwapToFoundry(
        targetFoundryTokenAddress, //token address on network 2
        targetTokenAddress,
        signer.address, //receiver
        amount, //targetToken amount
        { gasLimit: 1000000 }
      );

    const receipt = await result.wait();
    if (receipt.status == 1) {
      console.log("successfully executed the withdrawal");
      return true;
    }

    console.log("failed execute withdrawal");
    return false;
  }
}

exports.FIBERRouterContract = FIBERRouterContract;

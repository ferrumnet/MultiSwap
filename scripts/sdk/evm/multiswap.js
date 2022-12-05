const { ethers } = require("ethers");
require("dotenv").config();
const fundManagerAbi = require("../../../artifacts/contracts/upgradeable-Bridge/FundManager.sol/FundManager.json");

class MultiswapContract {
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

  async isFoundryAsset(asset) {
    const provider = new ethers.providers.JsonRpcProvider(this.rpcEndpoint);
    const targetFundMangerContract = new ethers.Contract(
      this.contract,
      fundManagerAbi.abi,
      provider
    );
    const isTargetTokenFoundryAsset =
      await targetFundMangerContract.isFoundryAsset(asset);
    return isTargetTokenFoundryAsset;
  }

  async allSigners() {
    // TODO:
  }

  async allLiquidity() {
    // TODO:
  }

  // admin function
  async addFoundryAsset(token) {
    // TODO:
  }

  // admin function
  async removeFoundryAsset(token) {
    // TODO:
  }

  // admin function
  async transferOwnership(new_owner) {
    // TODO:
  }

  // admin function
  async addSigner(signer) {
    // TODO:
  }

  // admin function
  async removeSigner(signer) {
    // TODO:
  }

  async addLiquidity(token, amount) {
    // TODO:
  }

  async removeLiquidity(token, amount) {
    // TODO:
  }

  async tokenBalance(token, address) {
    // TODO:
  }

  async swap(
    sourceToken,
    sourceAmount,
    targetNetworkId,
    targetTokenAddress,
    targetAddress
  ) {
    // TODO:
  }

  async withdraw(token, user, amount, salt, signature) {
    // TODO:
  }
}

exports.MultiswapContract = MultiswapContract;

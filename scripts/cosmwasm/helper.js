const { SigningCosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const { DirectSecp256k1HdWallet } = require("@cosmjs/proto-signing");
const { calculateFee, GasPrice } = require("@cosmjs/stargate");
const { toUtf8 } = require("@cosmjs/encoding");

class MultiswapContract {
  constructor(contract, rpcEndpoint, mnemonic) {
    this.contract = contract;
    this.rpcEndpoint = rpcEndpoint;
    this.mnemonic = mnemonic;
  }

  async isFoundryAsset(asset) {
    let wallet = await DirectSecp256k1HdWallet.fromMnemonic(this.mnemonic, {
      prefix: "cudos",
    });
    let client = await SigningCosmWasmClient.connectWithSigner(
      this.rpcEndpoint,
      wallet
    );
    const assets = await client.queryContractSmart(this.contract, {
      foundry_assets: {},
    });
    console.log("assets", assets);
    for (let i = 0; i < assets.length; i++) {
      if (assets[i] == asset) {
        return true;
      }
    }
    return false;
  }

  // admin function
  async add_foundry_asset(token) {
    let gasPrice = GasPrice.fromString("0.025stake");
    let wallet = await DirectSecp256k1HdWallet.fromMnemonic(this.mnemonic, {
      prefix: "cudos",
    });
    let client = await SigningCosmWasmClient.connectWithSigner(
      this.rpcEndpoint,
      wallet
    );
    let sender = await wallet.getAccounts().then((res) => {
      return res[0]?.address;
    });

    const tx = await client.signAndBroadcast(
      sender,
      [
        {
          typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
          value: {
            sender,
            msg: toUtf8(
              JSON.stringify({
                add_foundry_asset: {
                  token: token,
                },
              })
            ),
            contract: this.contract,
            funds: [],
          },
        },
      ],
      calculateFee(41000000, gasPrice)
    );
    console.log("Executed add_foundry_asset", tx.transactionHash);
  }

  // admin function
  async remove_foundry_asset(token) {
    let gasPrice = GasPrice.fromString("0.025stake");
    let wallet = await DirectSecp256k1HdWallet.fromMnemonic(this.mnemonic, {
      prefix: "cudos",
    });
    let client = await SigningCosmWasmClient.connectWithSigner(
      this.rpcEndpoint,
      wallet
    );
    let sender = await wallet.getAccounts().then((res) => {
      return res[0]?.address;
    });

    const tx = await client.signAndBroadcast(
      sender,
      [
        {
          typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
          value: {
            sender,
            msg: toUtf8(
              JSON.stringify({
                remove_foundry_asset: {
                  token: token,
                },
              })
            ),
            contract: this.contract,
            funds: [],
          },
        },
      ],
      calculateFee(41000000, gasPrice)
    );
    console.log("Executed remove_foundry_asset", tx.transactionHash);
  }

  // admin function
  async transfer_ownership(new_owner) {
    let gasPrice = GasPrice.fromString("0.025stake");
    let wallet = await DirectSecp256k1HdWallet.fromMnemonic(this.mnemonic, {
      prefix: "cudos",
    });
    let client = await SigningCosmWasmClient.connectWithSigner(
      this.rpcEndpoint,
      wallet
    );
    let sender = await wallet.getAccounts().then((res) => {
      return res[0]?.address;
    });

    const tx = await client.signAndBroadcast(
      sender,
      [
        {
          typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
          value: {
            sender,
            msg: toUtf8(
              JSON.stringify({
                transfer_ownership: {
                  new_owner: new_owner,
                },
              })
            ),
            contract: this.contract,
            funds: [],
          },
        },
      ],
      calculateFee(41000000, gasPrice)
    );
    console.log("Executed transfer_ownership", tx.transactionHash);
  }

  // admin function
  async add_signer(signer) {
    let gasPrice = GasPrice.fromString("0.025stake");
    let wallet = await DirectSecp256k1HdWallet.fromMnemonic(this.mnemonic, {
      prefix: "cudos",
    });
    let client = await SigningCosmWasmClient.connectWithSigner(
      this.rpcEndpoint,
      wallet
    );
    let sender = await wallet.getAccounts().then((res) => {
      return res[0]?.address;
    });

    const tx = await client.signAndBroadcast(
      sender,
      [
        {
          typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
          value: {
            sender,
            msg: toUtf8(
              JSON.stringify({
                add_signer: {
                  signer: signer,
                },
              })
            ),
            contract: this.contract,
            funds: [],
          },
        },
      ],
      calculateFee(41000000, gasPrice)
    );
    console.log("Executed add_signer", tx.transactionHash);
  }

  // admin function
  async remove_signer(signer) {
    let gasPrice = GasPrice.fromString("0.025stake");
    let wallet = await DirectSecp256k1HdWallet.fromMnemonic(this.mnemonic, {
      prefix: "cudos",
    });
    let client = await SigningCosmWasmClient.connectWithSigner(
      this.rpcEndpoint,
      wallet
    );
    let sender = await wallet.getAccounts().then((res) => {
      return res[0]?.address;
    });

    const tx = await client.signAndBroadcast(
      sender,
      [
        {
          typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
          value: {
            sender,
            msg: toUtf8(
              JSON.stringify({
                remove_signer: {
                  signer: signer,
                },
              })
            ),
            contract: this.contract,
            funds: [],
          },
        },
      ],
      calculateFee(41000000, gasPrice)
    );
    console.log("Executed remove_signer", tx.transactionHash);
  }

  async add_liquidity(token, amount) {
    let gasPrice = GasPrice.fromString("0.025stake");
    let wallet = await DirectSecp256k1HdWallet.fromMnemonic(this.mnemonic, {
      prefix: "cudos",
    });
    let client = await SigningCosmWasmClient.connectWithSigner(
      this.rpcEndpoint,
      wallet
    );
    let sender = await wallet.getAccounts().then((res) => {
      return res[0]?.address;
    });

    const tx = await client.signAndBroadcast(
      sender,
      [
        {
          typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
          value: {
            sender,
            msg: toUtf8(
              JSON.stringify({
                add_liquidity: {
                  token: token,
                  amount: amount,
                },
              })
            ),
            contract: this.contract,
            funds: [],
          },
        },
      ],
      calculateFee(41000000, gasPrice)
    );
    console.log("Executed add_liquidity", tx.transactionHash);
  }

  async remove_liquidity(token, amount) {
    let gasPrice = GasPrice.fromString("0.025stake");
    let wallet = await DirectSecp256k1HdWallet.fromMnemonic(this.mnemonic, {
      prefix: "cudos",
    });
    let client = await SigningCosmWasmClient.connectWithSigner(
      this.rpcEndpoint,
      wallet
    );
    let sender = await wallet.getAccounts().then((res) => {
      return res[0]?.address;
    });

    const tx = await client.signAndBroadcast(
      sender,
      [
        {
          typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
          value: {
            sender,
            msg: toUtf8(
              JSON.stringify({
                remove_liquidity: {
                  token: token,
                  amount: amount,
                },
              })
            ),
            contract: this.contract,
            funds: [],
          },
        },
      ],
      calculateFee(41000000, gasPrice)
    );
    console.log("Executed remove_liquidity", tx.transactionHash);
  }

  async tokenBalance(token, address) {
    client = await SigningCosmWasmClient.connectWithSigner(
      this.rpcEndpoint,
      wallet
    );
    const balance = await client.queryContractSmart(token, {
      balance_of: {
        address: address,
      },
    });
    return balance;
  }

  async swap(
    sourceToken,
    sourceAmount,
    targetNetworkId,
    targetTokenAddress,
    targetAddress
  ) {
    let gasPrice = GasPrice.fromString("0.025stake");
    let wallet = await DirectSecp256k1HdWallet.fromMnemonic(this.mnemonic, {
      prefix: "cudos",
    });
    let client = await SigningCosmWasmClient.connectWithSigner(
      this.rpcEndpoint,
      wallet
    );
    let sender = await wallet.getAccounts().then((res) => {
      return res[0]?.address;
    });

    const tx = await client.signAndBroadcast(
      sender,
      [
        {
          typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
          value: {
            sender,
            msg: toUtf8(
              JSON.stringify({
                swap: {
                  token: sourceToken,
                  amount: sourceAmount,
                  target_chain_id: targetNetworkId,
                  target_token: targetTokenAddress,
                  target_address: targetAddress,
                },
              })
            ),
            contract: this.contract,
            funds: [],
          },
        },
      ],
      calculateFee(41000000, gasPrice)
    );
    console.log("Executed swap", tx.transactionHash);
  }

  async withdraw(token, user, amount, salt, signature) {
    let gasPrice = GasPrice.fromString("0.025stake");
    let wallet = await DirectSecp256k1HdWallet.fromMnemonic(this.mnemonic, {
      prefix: "cudos",
    });
    let client = await SigningCosmWasmClient.connectWithSigner(
      this.rpcEndpoint,
      wallet
    );
    let sender = await wallet.getAccounts().then((res) => {
      return res[0]?.address;
    });

    const tx = await client.signAndBroadcast(
      sender,
      [
        {
          typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
          value: {
            sender,
            msg: toUtf8(
              JSON.stringify({
                withdraw_signed: {
                  payee: user,
                  token: token,
                  amount: amount,
                  salt: salt,
                  signature: signature,
                },
              })
            ),
            contract: this.contract,
            funds: [],
          },
        },
      ],
      calculateFee(41000000, gasPrice)
    );
    console.log("Executed withdraw", tx.transactionHash);
  }
}

exports.MultiswapContract = MultiswapContract;

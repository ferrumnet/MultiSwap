const { SigningCosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const { DirectSecp256k1HdWallet } = require("@cosmjs/proto-signing");
const { calculateFee, GasPrice } = require("@cosmjs/stargate");
const { toUtf8 } = require("@cosmjs/encoding");

class FIBERRouterContract {
  constructor(contract, rpcEndpoint, mnemonic, gasPrice) {
    this.contract = contract;
    this.rpcEndpoint = rpcEndpoint;
    this.mnemonic = mnemonic;
    this.gasPrice = gasPrice;
  }

  async getConnectedWallet() {
    let wallet = await DirectSecp256k1HdWallet.fromMnemonic(this.mnemonic, {
      prefix: "cudos",
    });
    let accounts = await wallet.getAccounts();
    return accounts[0].address;
  }

  async owner() {
    let wallet = await DirectSecp256k1HdWallet.fromMnemonic(this.mnemonic, {
      prefix: "cudos",
    });
    let client = await SigningCosmWasmClient.connectWithSigner(
      this.rpcEndpoint,
      wallet
    );
    const owner = await client.queryContractSmart(this.contract, {
      owner: {},
    });
    console.log("owner", owner);
    return owner;
  }

  async pool() {
    let wallet = await DirectSecp256k1HdWallet.fromMnemonic(this.mnemonic, {
      prefix: "cudos",
    });
    let client = await SigningCosmWasmClient.connectWithSigner(
      this.rpcEndpoint,
      wallet
    );
    const pool = await client.queryContractSmart(this.contract, {
      pool: {},
    });
    console.log("pool", pool);
    return pool;
  }

  // admin function
  async transferOwnership(new_owner) {
    let gasPrice = GasPrice.fromString(this.gasPrice);
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
  async setPool(pool) {
    let gasPrice = GasPrice.fromString(this.gasPrice);
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
                set_pool: {
                  pool: pool,
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

  async swap(
    sourceToken,
    sourceAmount,
    targetNetworkId,
    targetTokenAddress,
    targetAddress
  ) {
    let gasPrice = GasPrice.fromString(this.gasPrice);
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
            funds: [
              {
                denom: sourceToken,
                amount: sourceAmount,
              },
            ],
          },
        },
      ],
      calculateFee(41000000, gasPrice)
    );
    console.log("Executed swap", tx.transactionHash);
    return true;
  }

  async withdrawSigned(token, user, amount, salt, signature) {
    let gasPrice = GasPrice.fromString(this.gasPrice);
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
    console.log("Executed withdrawSigned", tx.transactionHash);
  }

  async withdraw(token, user, amount) {
    let gasPrice = GasPrice.fromString(this.gasPrice);
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
                  salt: "0x0",
                  signature: "0x0",
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

  async withdrawAndSwapToFoundry(foundryToken, token, amount) {
    let gasPrice = GasPrice.fromString(this.gasPrice);
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
                  payee: await this.getConnectedWallet(),
                  token: token,
                  amount: amount,
                  salt: "0x0",
                  signature: "0x0",
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
    console.log(
      "explorer: ",
      "https://explorer.testnet.cudos.org/transactions/F2DED41F7B473549D37D9B0AF2516D55B26BDA479A80A01258D8CD89FD2D9F0F"
    );
    return true;
  }
}

exports.FIBERRouterContract = FIBERRouterContract;

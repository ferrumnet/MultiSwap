require("dotenv").config();
const { Wallet, utils, providers } = require("ethers");

async function main() {
  // Note: when generating message on ferrum node, the order of fields should be kept.
  const messageText =
    '{"chain_id":"test","payee":"cudos1xe5u4gpq0jesl3v4pae80t3wknhd2hf0pj857x","token":"stake","amount":"1000","salt":"0x00"}';

  let provider = new providers.JsonRpcProvider();
  let privKey = process.env.PRIVATE_KEY;
  const wallet = new Wallet(privKey, provider);
  const signature = await wallet.signMessage(messageText);
  // Note: signature should not have 0x prefix when it's provided to withdraw signed command
  console.log("signature", signature.replace(/^0x/, ""));
  console.log("address", wallet.address.toLowerCase());
}

main();

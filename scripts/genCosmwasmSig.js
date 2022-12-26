require("dotenv").config();
const { Wallet, utils, providers } = require("ethers");

async function main() {
  // Note: when generating message on ferrum node, the order of fields should be kept.
  const messageText =
    '{"chain_id":"chain_id","payee":"payee","token":"token","amount":"10000","salt":"salt"}';

  let provider = new providers.JsonRpcProvider();
  let privKey = process.env.PRIVATE_KEY;
  const wallet = new Wallet(privKey, provider);
  const signature = await wallet.signMessage(messageText);
  // Note: signature should not have 0x prefix when it's provided to withdraw signed command
  console.log("signature", signature);
  console.log("address", wallet.address);
}

main();

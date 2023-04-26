require("dotenv").config();
const { Wallet, utils, providers } = require("ethers");

async function main() {
  // Note: when generating message on ferrum node, the order of fields should be kept.
  const messageText =
    '{"chain_id":"cudos-1","payee":"cudos1uc2lvphjnxrkarpfa9w7m33hctynusswy8m44y","token":"acudos","amount":"1000","salt":"0x10a7c04c194d6dc48fc4e5c0ccaad3f6611659bc00bf602d3538b7d45640c720"}';

  let provider = new providers.JsonRpcProvider();
  let privKey = process.env.PRIVATE_KEY0;
  const wallet = new Wallet(privKey, provider);
  const signature = await wallet.signMessage(messageText);
  // Note: signature should not have 0x prefix when it's provided to withdraw signed command
  console.log("signature", signature.replace(/^0x/, ""));
  console.log("address", wallet.address.toLowerCase());
}

main();

const { FIBERRouterContract } = require("./router");
require("dotenv").config();

async function main() {
  let denom = process.env.DENOM;
  let wallet2 = process.env.WALLET2;

  helper = new FIBERRouterContract(
    process.env.ROUTER || "",
    process.env.NODE || "",
    // cudos-noded tx bank send validator cudos1nysrj2xxpm77xpkvglne0zcvnxuq0laacc7nrv 100000000stake --keyring-backend=test --chain-id=test
    process.env.ADMIN_PRIVKEY || "",
    process.env.GAS_PRICE || ""
  );
  // await helper.owner();
  let pool = await helper.pool();
  // await helper.swap(denom, "100000", "111", "target_token", "target_address"); // 5F46502DD2C2C4B6EC490251B0E2984C369D622D394EF3E433D3F74F2314399A
  await helper.withdraw(denom, wallet2, "100000"); // ACB82ACB76E151DF3510BDAEF41DF493B87CADE2C4590FC7FB7D8B879CB134A5
  // await helper.withdrawSigned(denom, wallet2, "100000", "0x0", "0x0"); // ACB82ACB76E151DF3510BDAEF41DF493B87CADE2C4590FC7FB7D8B879CB134A5
  // await helper.transferOwnership(wallet2);
}

main();

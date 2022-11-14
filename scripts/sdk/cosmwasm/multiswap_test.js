const { MultiswapContract } = require("./multiswap");

async function main() {
  helper = new MultiswapContract(
    "cudos14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9strccpl",
    "http://localhost:26657",
    // cudos1nysrj2xxpm77xpkvglne0zcvnxuq0laacc7nrv
    // cudos-noded tx bank send validator cudos1nysrj2xxpm77xpkvglne0zcvnxuq0laacc7nrv 100000000stake --keyring-backend=test --chain-id=test
    "bag vintage surge smile upper medal lava peasant antique envelope reward mixture nut lemon aspect distance truth maple cricket burst grit result employ music"
  );
  let isFoundryAsset = await helper.isFoundryAsset("stake");
  console.log("isFoundryAsset", isFoundryAsset);
  let allSigners = await helper.allSigners();
  let allLiquidity = await helper.allLiquidity();
  await helper.swap("stake", "100000", "111", "target_token", "target_address");
  // await helper.withdraw(
  //   "stake",
  //   "cudos1nysrj2xxpm77xpkvglne0zcvnxuq0laacc7nrv",
  //   "100000",
  //   "0x0",
  //   "0x0"
  // );
  // await helper.owner();
  // await helper.add_foundry_asset("stake");
  // await helper.remove_foundry_asset("stake");
  // await helper.transfer_ownership("cudos1nysrj2xxpm77xpkvglne0zcvnxuq0laacc7nrv");
  // await helper.add_signer("cudos1nysrj2xxpm77xpkvglne0zcvnxuq0laacc7nrv");
  // await helper.remove_signer("cudos1nysrj2xxpm77xpkvglne0zcvnxuq0laacc7nrv");
  // await helper.add_liquidity("stake", "100000");
  // await helper.remove_liquidity("stake", "100");
}

main();

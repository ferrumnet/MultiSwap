const { FIBERRouterContract } = require("./router");

async function main() {
  helper = new FIBERRouterContract(
    "cudos14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9strccpl",
    "http://localhost:26657",
    // cudos1nysrj2xxpm77xpkvglne0zcvnxuq0laacc7nrv
    // cudos-noded tx bank send validator cudos1nysrj2xxpm77xpkvglne0zcvnxuq0laacc7nrv 100000000stake --keyring-backend=test --chain-id=test
    "bag vintage surge smile upper medal lava peasant antique envelope reward mixture nut lemon aspect distance truth maple cricket burst grit result employ music"
  );
  // await helper.owner();
  let pool = await helper.pool();
  await helper.swap("stake", "100000", "111", "target_token", "target_address");
  // await helper.withdraw(
  //   "stake",
  //   "cudos1nysrj2xxpm77xpkvglne0zcvnxuq0laacc7nrv",
  //   "100000",
  //   "0x0",
  //   "0x0"
  // );
  // await helper.transferOwnership("cudos1nysrj2xxpm77xpkvglne0zcvnxuq0laacc7nrv");
}

main();

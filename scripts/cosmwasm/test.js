const { MultiswapContract } = require("./helper");

async function main() {
  helper = new MultiswapContract(
    "cudos1qg5ega6dykkxc307y25pecuufrjkxkaggkkxh7nad0vhyhtuhw3syg2g9f",
    "http://localhost:26657",
    // cudos1nysrj2xxpm77xpkvglne0zcvnxuq0laacc7nrv
    // cudos-noded tx bank send validator cudos1nysrj2xxpm77xpkvglne0zcvnxuq0laacc7nrv 100000000stake --keyring-backend=test --chain-id=test
    "bag vintage surge smile upper medal lava peasant antique envelope reward mixture nut lemon aspect distance truth maple cricket burst grit result employ music"
  );
  let isFoundryAsset = await helper.isFoundryAsset("");
  console.log("isFoundryAsset", isFoundryAsset);
  // helper.swap("stake", "100000", "111", "target_token", "target_address");
  helper.withdraw(
    "stake",
    "cudos1nysrj2xxpm77xpkvglne0zcvnxuq0laacc7nrv",
    "100000",
    "0x0",
    "0x0"
  );
}

main();

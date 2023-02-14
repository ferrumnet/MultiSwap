const { MultiswapContract } = require("./multiswap");
require("dotenv").config();

async function main() {
  let denom = process.env.DENOM;
  let wallet2 = process.env.WALLET2;

  helper = new MultiswapContract(
    process.env.MULTISWAP || "",
    process.env.NODE || "",
    // cudos-noded tx bank send validator cudos1nysrj2xxpm77xpkvglne0zcvnxuq0laacc7nrv 100000000stake --keyring-backend=test --chain-id=test
    process.env.ADMIN_PRIVKEY || "",
    process.env.GAS_PRICE || ""
  );
  let isFoundryAsset = await helper.isFoundryAsset(denom);
  console.log("isFoundryAsset", isFoundryAsset);
  let allSigners = await helper.allSigners();
  let allLiquidity = await helper.allLiquidity();
  // await helper.swap(denom, "100000", "111", "target_token", "target_address");
  // await helper.withdraw(
  //   denom,
  //   wallet2,
  //   "100000",
  //   "0x0",
  //   "0x0"
  // );
  // await helper.owner();
  // await helper.addFoundryAsset(denom); // 1661E4E9462BB700159948B5409F0EA84A3836E2F8E45032AEC69E55CDFB02AA
  // await helper.removeFoundryAsset(denom);
  // await helper.transferOwnership(wallet2);
  // await helper.addSigner(wallet2);
  // await helper.removeSigner(wallet2);
  // await helper.addLiquidity(denom, "100000000000000000000"); // B58ADA4CEC2CC2949597EA58D34759844838A62DDBF528E2B701F8B236AD6FE0
  // await helper.removeLiquidity(denom, "100");
  // await helper.getTx("CB9DE8B321B1279DFC2A797876DCCBBD79D15B74B417B464B89926AAF6D50339");
  // await helper.setFee(denom, "100000000000000000000");
  // await helper.getFee();

}

main();

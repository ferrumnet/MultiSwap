// scripts/deployAll.js
const { ethers } = require('hardhat');

async function main() {
// Compile the contracts and libraries
 await hre.run('compile');

  const CCTPRouter = await ethers.getContractFactory('cctpRouter');
  const cctpRouter = await CCTPRouter.deploy();
  await cctpRouter.deployed();
  console.log('CctpRouter deployed to:', cctpRouter.address);

  await hre.run("verify:verify", {
    address: cctpRouter.address
  });
  console.log("Contract verified successfully !");

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

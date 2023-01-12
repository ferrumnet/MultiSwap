require("@nomicfoundation/hardhat-toolbox");
require('@nomiclabs/hardhat-ethers');
require('@openzeppelin/hardhat-upgrades');
const { ethers } = require("ethers");

/** @type import('hardhat/config').HardhatUserConfig */
require('dotenv').config();
module.exports = {
  solidity: {
    compilers: [{ version: "0.8.2", settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    } }],
  },
  networks: {
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY0],
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY0]
    },
    binance: {
      url: process.env.BINANCE_TESTNET_RPC,
      accounts:[process.env.PRIVATE_KEY0] 
    }
  },
  etherscan: {
    apiKey: process.env.API_KEY,
  },
};

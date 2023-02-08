require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");
require("@openzeppelin/hardhat-upgrades");
const { ethers } = require("ethers");
require('dotenv').config()

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.2",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
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
    polygon: {
      url: `https://polygon-rpc.com`,
      accounts: [process.env.PRIVATE_KEY0]
    },
    ethereum: {
      url: `https://nd-611-696-948.p2pify.com/8a54d0bc389e645253087fd1a6c5fe3a`,
      accounts:[process.env.PRIVATE_KEY0, process.env.PRIVATE_KEY1] 
    },
    binance: {
      url: `https://nd-409-138-440.p2pify.com/a2b2f87cd496703b1cc64ff8e91b7981`,
      accounts:[process.env.PRIVATE_KEY0, process.env.PRIVATE_KEY1] 
    },
    bscMainnet: {
      url: `https://bscrpc.com`,
      accounts:[process.env.PRIVATE_KEY_MAINNET] 
    },
    polygonMainnet: {
      url: `https://polygon-rpc.com`,
      accounts:[process.env.PRIVATE_KEY_MAINNET] 
    },
  },
  etherscan: {
    apiKey: process.env.BSCSCAN_API_KEY,
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY,
  },
};

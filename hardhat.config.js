require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");
require("@openzeppelin/hardhat-upgrades");
require('solidity-coverage')
const { ethers } = require("ethers");
require("dotenv").config();

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.6.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 20,
          },
        },
      },
      {
        version: "0.5.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 20,
          },
        },
      },
      {
        version: "0.7.3",
        settings: {
          optimizer: {
            enabled: true,
            runs: 20,
          },
        },
      },
      {
        version: "0.8.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 20,
          },
        },
      },
      {
        version: "0.8.2",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.4.18",
        settings: {
          optimizer: {
            // enabled: true,
            // runs: 200,
          },
        },
      },
    ]
  },
  networks: {
    hardhat: {
      forking: {
        url: `https://goerli.blockpi.network/v1/rpc/public`,

      },
      // url: "http://localhost:8545", // default Hardhat Network URL
      chainId: 31337,
    },
    goerli: {
      url: `https://nd-018-780-500.p2pify.com/8d55fdf55750fe8f435ef82b610d1bba`,
      accounts: [process.env.PRIVATE_KEY0, process.env.PRIVATE_KEY1],
    },
    ethereum: {
      url: `https://nd-611-696-948.p2pify.com/8a54d0bc389e645253087fd1a6c5fe3a`,
      accounts: [process.env.PRIVATE_KEY0, process.env.PRIVATE_KEY1],
    },
    binance: {
      url: `https://nd-409-138-440.p2pify.com/a2b2f87cd496703b1cc64ff8e91b7981`,
      accounts: [process.env.PRIVATE_KEY0, process.env.PRIVATE_KEY1],
    },
  },
  etherscan: {
    apiKey: process.env.BSCSCAN_API_KEY,
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY,
  },
};

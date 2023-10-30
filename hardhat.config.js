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
        version: "0.8.18",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.17",
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
      url: `https://bsc-mainnet.rpcfast.com?api_key=xbhWBI1Wkguk8SNMu1bvvLurPGLXmgwYeC4S6g2H7WdwFigZSmPWVZRxrskEQwIf`,
      accounts: [process.env.PRIVATE_KEY0, process.env.PRIVATE_KEY1],
    },
    neonTestnet: {
      url: `https://proxy.devnet.neonlabs.org/solana`,
      accounts: [process.env.PRIVATE_KEY0, process.env.PRIVATE_KEY1],
    },
    polygon: {
      url: `https://nd-003-843-665.p2pify.com/7af52d3a77b5d19f11de64357253ca16`,
      accounts: [process.env.PRIVATE_KEY0, process.env.PRIVATE_KEY1],
      networkCheckTimeout: 999999,
      timeoutBlocks: 200,
      gas: 12400000,
      gasPrice: 1110000000,
    },
    ethereum: {
      url: `https://nd-611-696-948.p2pify.com/8a54d0bc389e645253087fd1a6c5fe3a`,
      accounts: [process.env.PRIVATE_KEY0, process.env.PRIVATE_KEY1],
      networkCheckTimeout: 999999,
      timeoutBlocks: 200,
      // gas: 12400000,
      // gasPrice: 1110000000,
    },
    arbitrum: {
      url: `https://nd-827-555-321.p2pify.com/fc3eea1a96148177e332fff558188fa9`,
      accounts: [process.env.PRIVATE_KEY0, process.env.PRIVATE_KEY1],
    },
  },
  // ...rest of the config...
  etherscan: {
    apiKey: "4UAT5873ISJN624VKTNNN5YFSQD2BECEEQ",
  },
}

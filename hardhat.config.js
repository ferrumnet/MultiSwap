require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");
require("@openzeppelin/hardhat-upgrades");
const { ethers } = require("ethers");

/** @type import('hardhat/config').HardhatUserConfig */
require("dotenv").config();
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
    url: 'https://nd-018-780-500.p2pify.com/8d55fdf55750fe8f435ef82b610d1bba',
    accounts:['ecea137a71af64d87ec1772498ba2d8f52f7d3e3d96ae5fb93ce5b236cd0d904']
  },
  binance: {
    url: 'https://nd-409-138-440.p2pify.com/a2b2f87cd496703b1cc64ff8e91b7981',
    accounts:['ecea137a71af64d87ec1772498ba2d8f52f7d3e3d96ae5fb93ce5b236cd0d904']
  },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  bscscan: {
    apiKey: process.env.BSCSCAN_API_KEY,
  },
};

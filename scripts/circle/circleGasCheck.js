const { ethers } = require('ethers');
const Web3Utils = require('web3-utils');
const Web3 = require('web3');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config()
// Specify network configurations
const networkConfig = {
    ethereum: {
        apiBaseUrl: 'https://api.etherscan.io/api',
        aoiKey: process.env.ETHERSCAN_API_KEY,
        startBlock: 18874936,
        offset: 1000,
        networkProvider: 'https://nd-611-696-948.p2pify.com/8a54d0bc389e645253087fd1a6c5fe3a',
        messageTransmitterAddress: '0x0a992d191deec32afe36203ad87d7d289a738f81',
    },
    arbitrum: {
        apiBaseUrl: 'https://api.arbiscan.io/api',
        apiKey: process.env.ARBISCAN_API_KEY,
        startBlock: 200000000,
        offset: 10000,
        networkProvider: 'https://nd-829-997-700.p2pify.com/790712c620e64556719c7c9f19ef56e3',
        messageTransmitterAddress: '0xC30362313FBBA5cf9163F0bb16a0e01f01A896ca',
    },
    base: {
        apiBaseUrl: 'https://api.basescan.org/api',
        apiKey: process.env.BASESCAN_API_KEY,
        startBlock: 12776631,
        offset: 3000,
        networkProvider: 'https://base-mainnet.core.chainstack.com/e7aa01c976c532ebf8e2480a27f18278',
        messageTransmitterAddress: '0xAD09780d193884d503182aD4588450C416D6F9D4',
    },
    optimism: {
        apiBaseUrl: 'https://api-optimistic.etherscan.io/api',
        apiKey: process.env.OPTIMISTIC_ETHERSCAN_API_KEY,
        startBlock: 118080200, // Customize this for Optimism
        offset: 10000, // Customize this for Optimism
        networkProvider: 'https://optimism-mainnet.core.chainstack.com/7cb5109bd1c125224315d9b753cc0e45',
        messageTransmitterAddress: '0x4d41f22c5a0e5c74090899e5a8fb597a8842b3e8',
    },
    avalanche: {
        apiBaseUrl: 'https://your-custom-url.com/api', // Customize this URL for Avalanche
        apiKey: process.env.AVALANCHESCAN_API_KEY,
        startBlock: 118080200, // Customize this for Avalanche
        offset: 10000, // Customize this for Avalanche
        networkProvider: 'https://nd-118-315-546.p2pify.com/048dd2e7493f4804ffed70b2acfffe8b/ext/bc/C/rpc',
        messageTransmitterAddress: '0x8186359af5f57fbb40c6b14a588d2a59c0c29880',
    },
};

const argv = require('minimist')(process.argv.slice(2));
// Retrieve network from command line arguments
const network = Array.isArray(argv._) ? argv._[0] : argv.network;

// Get network specific configurations
const config = networkConfig[network];
// Validate network configuration
if (!config) {
    console.error('Invalid network.');
    return;
}
// Destructure config for easier access
const { apiBaseUrl, apiKey, startBlock, offset, networkProvider, messageTransmitterAddress } = config;
// Validate provider URL
if (!networkProvider) {
    console.error('Invalid network provider URL.');
    return;
}
// Validate API base URL
if (!apiBaseUrl) {
    console.error('API Base URL not defined for network.');
    return;
}
// Validate starting block and offset
if (!startBlock || !offset) {
    console.error('Starting block or offset not defined for network.');
    return;
}

const web3 = new Web3(networkProvider);
const methodId = '0x57ecfd28';  // receiveMessage of WithdrawalAttestation

async function fetchTransactions(startBlock, offset) {
    try {
        const url = `${apiBaseUrl}?module=account&action=txlist&address=${messageTransmitterAddress}&startblock=${startBlock}&endblock=latest&page=1&offset=${offset}&sort=asc&apikey=${apiKey}`;
        const response = await axios.get(url);

        if (response.data.status !== '1') {
            console.error('Error fetching transactions:', response.data.message);
            return;
        }
        const transactions = response.data.result;
        // Filter transactions with the specific methodId
        const filteredTransactions = transactions.filter(tx => tx.input.startsWith(methodId));

        if (filteredTransactions.length === 0) {
            console.log(`No transactions found with methodId ${methodId}.`);
            return;
        }
        let totalGasLimit = 0;
        let totalGasUsed = 0;
        let totalTransactionFee = 0;

        // Extract gas limit and transaction fee from filtered transactions
        filteredTransactions.forEach(tx => {
            const gasLimit = parseInt(tx.gas);
            const gasUsed = parseInt(tx.gasUsed);
            const transactionFee = gasUsed * tx.gasPrice;
            console.log(`Transaction Hash: ${tx.hash}`);
            console.log("gas price:", tx.gasPrice);
            console.log(`Gas Limit: ${gasLimit}`);
            console.log(`Gas Used: ${gasUsed}`);
            console.log(`Transaction Fee: ${transactionFee}`);
            totalGasLimit += gasLimit;
            totalGasUsed += gasUsed;
            totalTransactionFee += transactionFee;
        });
        const averageGasLimit = totalGasLimit / filteredTransactions.length;
        const averageGasUsed = totalGasUsed / filteredTransactions.length;
        const averageTransactionFee = totalTransactionFee / filteredTransactions.length;

        console.log(`Average Gas Limit: ${parseInt(averageGasLimit, 10)}`);
        console.log(`Average Gas Used: ${parseInt(averageGasUsed, 10)}`);
        console.log(`Average Transaction Fee in Wei: ${parseInt(averageTransactionFee, 10)}`)
        console.log(`Average Transaction Fee in Ether: ${web3.utils.fromWei(parseInt(averageTransactionFee, 10).toString())} ETH`)

    } catch (error) {
        console.error('Error fetching transactions:', error);
    }
}

fetchTransactions(startBlock, offset);

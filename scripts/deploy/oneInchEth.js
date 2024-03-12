const Web3 = require('web3');
const axios = require('axios');
const { BigNumber } = require('ethers');
const ethers = require('ethers');
const fs = require('fs');
const erc20Abi = [
    {
      "constant": true,
      "inputs": [],
      "name": "name",
      "outputs": [
        {
          "name": "",
          "type": "string"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "symbol",
      "outputs": [
        {
          "name": "",
          "type": "string"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "decimals",
      "outputs": [
        {
          "name": "",
          "type": "uint8"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "name": "balance",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "spender",
          "type": "address"
        },
        {
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "approve",
      "outputs": [
        {
          "name": "success",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "owner",
          "type": "address"
        },
        {
          "name": "spender",
          "type": "address"
        }
      ],
      "name": "allowance",
      "outputs": [
        {
          "name": "remaining",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "name": "initialSupply",
          "type": "uint256"
        },
        {
          "name": "tokenName",
          "type": "string"
        },
        {
          "name": "tokenSymbol",
          "type": "string"
        }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "payable": true,
      "stateMutability": "payable",
      "type": "fallback"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "name": "to",
          "type": "address"
        },
        {
          "indexed": false,
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "Transfer",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "name": "spender",
          "type": "address"
        },
        {
          "indexed": false,
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "Approval",
      "type": "event"
    }
  ];
  
  const chainId = 56;
  const web3RpcUrl = 'https://bsc-dataseed.binance.org';
  // const web3RpcUrl = 'https://nd-611-696-948.p2pify.com/8a54d0bc389e645253087fd1a6c5fe3a';
  const swapRouterAddress = '';
  const APIKey = 'VzQhyrvJgrc1I4nL9NOUwbdH95XSJ0wo';
  // Create a wallet using your private key
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY0);
  const ethProvider = new ethers.providers.JsonRpcProvider(web3RpcUrl);
  const sourceSigner = signer.connect(ethProvider);
  // Define your wallet address and private key
  const walletAddress = '';

const slippage = 2;

async function swapToken(fromTokenAddress, toTokenAddress, amount) {

  try {
    // Fetch swap details from 1inch API
    const response = await axios.get(
        `https://api.1inch.dev/swap/v5.2/${chainId}/swap?src=${fromTokenAddress}&dst=${toTokenAddress}&amount=${amount}&from=${swapRouterAddress}&slippage=${slippage}&receiver=${swapRouterAddress}&disableEstimate=true&includeProtocols=true&allowPartialFill=true`,
        {
          headers: {
            Authorization: `Bearer ${APIKey}`, // Include the API key in the Authorization header
          },
        }
    );      

    const swapDetails = response.data.tx.data;
console.log(swapDetails)
    const toAmount = response.data.toAmount;
    console.log("'\n SwapOutAMount", toAmount);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function main(){

// Define token addresses and swap details

// // FRM --> USDC Swap 
const fromTokenAddress = '0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD'; // LINK
const toTokenAddress = '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'; // USDC  


// // USDC --> FRM Swap 
// const fromTokenAddress = '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'; // USDC
// const toTokenAddress = '0xA719b8aB7EA7AF0DDb4358719a34631bb79d15Dc'; // FRM

let decimals = await checkDecimalsFunction(fromTokenAddress);
let srcAmount = 0.01;
let rawAmount = BigNumber.from(parseInt(srcAmount*10000)+'') * (10 ** BigNumber.from(decimals-4+'') );

const swapAmount = rawAmount.toString(); // Convert to a string
swapToken(fromTokenAddress, toTokenAddress, swapAmount);
}

main()


// Utility Functions
function convertTokensToEth(amount, decimals) {
  const ethValue = amount / 10 ** decimals;
  return ethValue;
}

async function checkDecimalsFunction(tokenAddress) {
  const tokenContract = new ethers.Contract(
    tokenAddress,
    erc20Abi,
    ethProvider
  );

  try {
    const decimals = await tokenContract.decimals();
    // console.log("Decimals:", decimals.toString());
    return  parseInt(decimals)
  } catch (error) {
    console.error("Error - doesnt support decimal --:", error.message);
  }
}


function storeVariableData(variableData, filePath) {
  // Convert variable data to JSON string with line break
  const jsonData = JSON.stringify(variableData, null, 2) + ',\n'; // Append a line break after each JSON object

  // Write JSON data to the file in append mode
  fs.appendFileSync(filePath, jsonData, 'utf8');

  console.log(`1inch data has been stored in ${filePath}`);
}


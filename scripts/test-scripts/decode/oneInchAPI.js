const Web3 = require('web3');
const axios = require('axios');
const { BigNumber } = require('ethers');
const ethers = require('ethers');

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
// Define the chain ID and Web3 RPC URL
const chainId = 56;
const web3RpcUrl = 'https://nd-611-696-948.p2pify.com/8a54d0bc389e645253087fd1a6c5fe3a';

const swapRouterAddress = '0x';
const APIKey = 'avj9CzT7GnLU5nGp1UhrwwmLprlBwAix';

const ethProvider = new ethers.providers.JsonRpcProvider(web3RpcUrl);
// Define your wallet address and private key
const walletAddress = '0x';
const slippage = 1;

async function swapToken(fromTokenAddress, toTokenAddress, amount) {

  try {
    // Fetch swap details from 1inch API
    
  const response = await axios.get(
      `https://api.1inch.dev/swap/v5.2/${chainId}/swap?src=${fromTokenAddress}&dst=${toTokenAddress}&amount=${amount}&from=${swapRouterAddress}&slippage=${slippage}&receiver=${walletAddress}&disableEstimate=true&includeProtocols=true&allowPartialFill=true`,
      {
        headers: {
          Authorization: `Bearer ${APIKey}`, // Include the API key in the Authorization header
        },
      }
  );   

    const swapDetails = response.data.tx.data;
    console.log(response.data);
    console.log(swapDetails)
    const toAmount = response.data.toAmount;
    console.log("Amount", toAmount)

    const desTokenDecimal = 8
    console.log("dest", desTokenDecimal)
    const swapToAmount = convertTokensToEth(toAmount, desTokenDecimal);
    
    // console.log('Swap amount:', swapAmountInETH);
    console.log('Amount to be received', swapToAmount);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function main(){
// BSC Network 

    // // USDC --> FRM Swap 
    const fromTokenAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' //USDC
    const toTokenAddress = '0xE5CAeF4Af8780E59Df925470b050Fb23C43CA68C'; // FRM

    let decimals = await checkDecimalsFunction(fromTokenAddress);
    console.log(decimals)

    let srcAmount = 1
    let rawAmount = BigNumber.from(parseInt(srcAmount*10000)+'') * (10 ** BigNumber.from(decimals-4+'') );

    const swapAmount = rawAmount.toString(); // Convert to a string
    console.log(swapAmount);
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
    console.log("Decimals:", decimals.toString());
    return  parseInt(decimals)
  } catch (error) {
    console.error("Error - doesnt support decimal --:", error.message);
  }
}

//   async function convertToWei(amount) {
//     const sourceTokenContract = new ethers.Contract(
//       fromTokenAddress,
//       erc20Abi,
//       ethProvider
//     );
// ​
//     const sourceTokenDecimal = await sourceTokenContract.decimals();
//     console.log("Decimal Points ", sourceTokenDecimal);
// ​
//     return tokenAmountToWei(amount, sourceTokenDecimal);
//   }
// ​
//   function tokenAmountToWei(amount, decimals) {
//     const amountInWei = BigNumber.from(amount).mul(BigNumber.from(10).pow(decimals));
//     return amountInWei.toString();
//   }

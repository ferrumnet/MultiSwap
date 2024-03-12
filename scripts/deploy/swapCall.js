const { ethers } = require('ethers');
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
const fundManagerABI = require('../../artifacts/contracts/multiswap-contracts/FundManager.sol/FundManager.json');
const fiberRouterABI = require("../../artifacts/contracts/multiswap-contracts/FiberRouter.sol/FiberRouter.json");
const axios = require('axios');
const { BigNumber } = require('ethers');
const fiberRouterAddress = '0xfc3c6f9B7c4C0d7d9C10C313BBfFD1ed89afb1a7';
const fundManagerAddress = '0xBFE96b3524a5d31B803BA133844C002Beaa79373';

const foundryArbitrum = "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8";
const foundryBinance = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";
const foundryEthereum = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

const receiverAddress = "0xB5d1E1Ff700CFC0c687F1Fc99284E94ab0ef63E5";

const OneInchCaller = '0x787c19Eb92b5B0d134E0Ff704386E1aB58A1C00b';


// The wallet where the gas received from sourceNetwork will be transferred
const gasWallet = "0xB5d1E1Ff700CFC0c687F1Fc99284E94ab0ef63E5";
const APIKey = 'VzQhyrvJgrc1I4nL9NOUwbdH95XSJ0wo';
// the address that is allowed to call the estimate gas fee for withdrawal functions
const gasEstimationAddress = "0x"

const chainId = 56;
const ethereumChainID = 1;
const arbitrumChainID = 42161;
const ethProvider = 'https://nd-611-696-948.p2pify.com/8a54d0bc389e645253087fd1a6c5fe3a';
const arbiProvider = 'https://nd-829-997-700.p2pify.com/790712c620e64556719c7c9f19ef56e3';
const bscProvider = 'https://rpc.tornadoeth.cash/bsc';

const provider = new ethers.providers.JsonRpcProvider(bscProvider);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY0 , provider);

// Connect to FiberRouter and FundManager contracts
const fiberRouter = new ethers.Contract(fiberRouterAddress, fiberRouterABI.abi, provider);
const fundManager = new ethers.Contract(fundManagerAddress, fundManagerABI.abi, provider);

const slippage =2;

// const fromTokenAddress = '0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD'; // LINK
// const toTokenAddress = '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'; // USDC  

const fromTokenAddress = '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'; // USDC
const toTokenAddress = '0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD'; // LINK  

async function main() {
  
  let decimals = await checkDecimalsFunction(fromTokenAddress);
  let srcAmount = 0.1;
  let rawAmount = BigNumber.from(parseInt(srcAmount*10000)+'') * (10 ** BigNumber.from(decimals-4+'') );
  
  const swapAmount = rawAmount.toString(); // Convert to a string

  // swapOneInchCall(fromTokenAddress, toTokenAddress, swapAmount);
  withdrawOneInchCall(fromTokenAddress, toTokenAddress, swapAmount);

  // swapAndCrossOneInch();  

}

const amountIn = "100000000000000000";  // Example: 100 tokens
const amountOut = "1943673749379689580"; // Example: 200 tokens
const crossTargetNetwork = 42161; // Example: 2 for a specific network
const crossTargetToken = '0x9f6AbbF0Ba6B5bfa27f4deb6597CC6Ec20573FDA'; // Example: Ethereum address of the token
const crossTargetAddress = '0xB5d1E1Ff700CFC0c687F1Fc99284E94ab0ef63E5'; // Example: Ethereum address for cross-target
const oneInchData = '0x000000000000000000000000e37e799d5077682fa0a244d46e5649f71457bd09000000000000000000000000f8a0bf9cf54bb92f17374d9e9a321e6a111a51bd0000000000000000000000008ac76a51cc950d9822d68b83fe1ad97b32cd580d000000000000000000000000e37e799d5077682fa0a244d46e5649f71457bd09000000000000000000000000bfe96b3524a5d31b803ba133844c002beaa79373000000000000000000000000000000000000000000000000016345785d8a00000000000000000000000000000000000000000000000000001af950fa1f072c6c0000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000001600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008100000000000000000000000000000000000000000000000000000000006302a00000000000000000000000000000000000000000000000001af950fa1f072c6cee63c1e580cd8ec24720426fe384be64246076b5b0e7a61cb2f8a0bf9cf54bb92f17374d9e9a321e6a111a51bd1111111254eeb25477b68fb85ed929f73a960582000000000000000000000000000000000000000000000000000000000000008b1ccac8'; // Example: Hex-encoded 1inch data
const fromToken = fromTokenAddress; // Example: Ethereum address of the from token
const foundryToken = toTokenAddress; // Example: Ethereum address of the foundry token
const withdrawalData = '0xf30f0419479f74e1f49411c87a5e426f2db5cc57998e982e343dbb8360b9098d'; // Example: Hex-encoded withdrawal data
const funcSelector = 2; // Example: Replace with the appropriate enum value
async function swapAndCrossOneInch() {

  try {
    // Perform the swapAndCrossOneInch transaction
    const tx = await fiberRouter.connect(wallet).swapAndCrossOneInch(
      amountIn,
      amountOut,
      crossTargetNetwork,
      crossTargetToken,
      crossTargetAddress,
      oneInchData,
      fromToken,
      foundryToken,
      withdrawalData,
      funcSelector,
      { value: ethers.utils.parseEther('0.001') } // Example: Sending 0.1 ETH as gas
    );

    // Wait for the transaction to be mined
    await tx.wait();

    console.log('Swap and Cross OneInch successful. Transaction hash:', tx.hash);
  } catch (error) {
    console.error('Error executing Swap and Cross OneInch:', error.message);
  }
}

async function swapOneInchCall(fromTokenAddress, toTokenAddress, amount) {

  try {
    // Fetch swap details from 1inch API
    const response = await axios.get(
        `https://api.1inch.dev/swap/v5.2/${chainId}/swap?src=${fromTokenAddress}&dst=${toTokenAddress}&amount=${amount}&from=${OneInchCaller}&slippage=${slippage}&receiver=${OneInchCaller}&disableEstimate=true&includeProtocols=true&allowPartialFill=true`,
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

async function withdrawOneInchCall(fromTokenAddress, toTokenAddress, amount) {

  try {
    // Fetch swap details from 1inch API
    const response = await axios.get(
        `https://api.1inch.dev/swap/v5.2/${chainId}/swap?src=${fromTokenAddress}&dst=${toTokenAddress}&amount=${amount}&from=${fiberRouterAddress}&slippage=${slippage}&receiver=${receiverAddress}&disableEstimate=true&includeProtocols=true&allowPartialFill=true`,
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


async function checkDecimalsFunction(tokenAddress) {
  const tokenContract = new ethers.Contract(
    tokenAddress,
    erc20Abi,
    provider
  );

  try {
    const decimals = await tokenContract.decimals();
    // console.log("Decimals:", decimals.toString());
    return  parseInt(decimals)
  } catch (error) {
    console.error("Error - doesnt support decimal --:", error.message);
  }
}


main();
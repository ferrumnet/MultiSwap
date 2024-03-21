// scripts/initializeCCT.js
const { ethers } = require('hardhat');
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
const mumbaiProvider = 'https://polygon-mumbai-pokt.nodies.app';
const provider = new ethers.providers.JsonRpcProvider(mumbaiProvider);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY0 , provider);
const tokenAddress = "0x9999f7fea5938fd3b1e26a12c3f2fb024e194f97";
  const tokenContract = new ethers.Contract(
    tokenAddress,
    erc20Abi,
    provider
  );

async function main() {
  const CCTPRouter = await ethers.getContractFactory('cctpRouter');
  const cctpRouterAddress = "0x5Af5FD031954c69CD6Ac5750B6000075B3A9A9D4"; 
  const cctpRouter = CCTPRouter.attach(cctpRouterAddress);

// // Initialising CCTP with TokenMessenger, USDC & Target Receiver Address
//   const cctpTokenMessengerAddress = "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5";
//   const usdcTokenAddress = "0x9999f7fea5938fd3b1e26a12c3f2fb024e194f97";
//   const targetCCTPFundManagerAddress = "0xB5d1E1Ff700CFC0c687F1Fc99284E94ab0ef63E5";
//   await initializeCCT(cctpRouter, cctpTokenMessengerAddress, usdcTokenAddress, targetCCTPFundManagerAddress);

  const amount = "1000";  // 0.001
  const targetNetworkDomain = 3;  // Arbitrum Sepolia Testnet Domain: 3

// Perform SWAP of USDC using CCTP 
  await performCCTSwap(cctpRouter, amount, targetNetworkDomain);
}

async function initializeCCT(cctpRouter, cctpTokenMessengerAddress, usdcTokenAddress, targetCCTPFundManagerAddress) {

    // Initialize CCTP contract
    const txInit = await cctpRouter.init(
        cctpTokenMessengerAddress,
        usdcTokenAddress,
        targetCCTPFundManagerAddress
    );

    // Wait for the transaction receipt
    const txInitReceipt = await txInit.wait();
  
    if (txInitReceipt.status == 1) {
        console.log('Initialization completed');
    } else {
        console.log("Transaction failed");
    }
  }

async function performCCTSwap(cctpRouter, amount, targetNetworkDomain) {
    // Initiate a Circle Cross-Chain Transfer
    const txSwap = await cctpRouter.cctpSwap(
      amount,
      targetNetworkDomain
    );

    // Wait for the transaction receipt
    txSwapReceipt = await txSwap.wait();
  
    if (txSwapReceipt.status == 1) {
        console.log('CCTP USDC Swap is Successful: ', txSwap.hash);
    } else {
        console.log("Transaction failed");
    }
  }

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


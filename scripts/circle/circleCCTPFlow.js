const { ethers } = require('hardhat');
const { BigNumber } = require('ethers');
const Web3 = require('web3');
const messageTransmitterAbi = require('../abis/cctp/MessageTransmitter.json');
const targetFundManagerAbi = require('../../artifacts/contracts/multiswap-contracts/FundManager.sol/FundManager.json').abi;

const networkProviders = {
  ethereum: 'https://nd-611-696-948.p2pify.com/8a54d0bc389e645253087fd1a6c5fe3a',
  avalanche: 'https://nd-118-315-546.p2pify.com/048dd2e7493f4804ffed70b2acfffe8b/ext/bc/C/rpc',
  opMainnet: 'https://optimism-mainnet.core.chainstack.com/7cb5109bd1c125224315d9b753cc0e45',
  arbitrum: 'https://nd-829-997-700.p2pify.com/790712c620e64556719c7c9f19ef56e3',
  base: 'https://base-mainnet.core.chainstack.com/e7aa01c976c532ebf8e2480a27f18278',
  polygon: 'https://polygon-mainnet.g.alchemy.com/v2/your-api-key'
};

// Define contract addresses for MessageTransmitter contracts
const messageTransmitterAddresses = {
  ethereum: '0x0a992d191deec32afe36203ad87d7d289a738f81',
  avalanche: '0x8186359af5f57fbb40c6b14a588d2a59c0c29880',
  opMainnet: '0x4d41f22c5a0e5c74090899e5a8fb597a8842b3e8',
  arbitrum: '0xC30362313FBBA5cf9163F0bb16a0e01f01A896ca',
  base: '0xAD09780d193884d503182aD4588450C416D6F9D4',
  polygon: '0xF3be9355363857F3e001be68856A2f96b4C39Ba9'
};

// Function to get provider based on network name
function getProvider(network) {
  return networkProviders[network] || '';
}

// Function to get contract address based on network name
function getMessageTransmitterAddress(network) {
  return messageTransmitterAddresses[network] || '';
}

async function main() {
  const sourceNetwork = "arbitrum";
  const targetNetwork = "avalanche";
  const minAmountOut = ethers.utils.parseUnits('100', 6); // MinAmount from call data

  // STEP 1: Determine CCTP type
  const cctpType = await decideCCTPType(targetNetwork, minAmountOut);

  if (cctpType) {
    // STEP 2: Perform CCTP flow
    console.log('Performing CCTP flow...');

    // STEP 3: Call swap() or swapAndCrossRouter() function with cctpType = true;
    await swap();
    await swapAndCrossRouter();

    // STEP 4: Call this function for circle's attestation to perform withdrawal to fundManager of targetNetwork  
    await circleAttestation(sourceNetwork, targetNetwork);

    // STEP 5: Call withdrawSigned & withdrawSignedAndSwapRouter functions here after attestation is completed
    await withdrawSigned();
    await withdrawSignedAndSwapRouter();

  } else {
    // Perform normal flow
    console.log('Performing normal flow...');
    // await swap();
    // await swapAndCrossRouter();
    // await withdrawSigned();
    // await withdrawSignedAndSwapRouter();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

async function decideCCTPType(targetNetwork, minAmountOut) {
  let cctpType = false;
  let targetFundManagerAddress;

  // Get the appropriate FundManager contract address based on the target network
  switch (targetNetwork) {
    case 'ethereum':
      targetFundManagerAddress = '0x'; // Ethereum FundManager contract address
      break;
    case 'avalanche':
      targetFundManagerAddress = '0x'; // Avalanche FundManager contract address
      break;
    case 'arbitrum':
      targetFundManagerAddress = '0x'; // arbitrum FundManager contract address
      break;
    case 'opMainnet':
      targetFundManagerAddress = '0x'; // opMainnet FundManager contract address
      break;
    case 'base':
      targetFundManagerAddress = '0x'; // base FundManager contract address
      break;
    case 'polygon':
      targetFundManagerAddress = '0x'; // polygon FundManager contract address
      break;
    default:
      console.error('Invalid target network.');
      return false;
  }

  const provider = new ethers.providers.JsonRpcProvider(networkProviders[targetNetwork]);
  const targetFundManagerContract = new ethers.Contract(targetFundManagerAddress, targetFundManagerAbi, provider);

  // Get current balance of target network FundManager contract
  const balance = await targetFundManagerContract.balance();

  // Compare balance with minAmountOut to decide CCTP type
  // If TargetFundManager has enough usdc liquidity to perform the withdraw
  if (balance.gte(minAmountOut)) {
    cctpType = false;
    console.log('Normal flow selected.');
  } else {
    cctpType = true;
    console.log('CCTP flow selected.');
  }

  return cctpType;
}

async function circleAttestation(sourceNetwork, targetNetwork) {
  const sourceProvider = getProvider(sourceNetwork);
  const targetProvider = getProvider(targetNetwork);

  if (!sourceProvider || !targetProvider) {
    console.error('Invalid source or target network.');
    return;
  }

  // Source Sender Network
  const web3 = new Web3(sourceProvider);

  // Add target network private key used for signing transactions
  const targetSigner = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY0);
  web3.eth.accounts.wallet.add(targetSigner);

  // MessageTransmitterAddress is used on TargetNetwork to withdraw the Tokens
  const messageTransmitterAddress = getMessageTransmitterAddress(targetNetwork);
  if (!messageTransmitterAddress) {
    console.error('MessageTransmitter address not found for target network.');
    return;
  }
  const messageTransmitterContract = new web3.eth.Contract(messageTransmitterAbi, messageTransmitterAddress, {from: targetSigner.address});

  // STEP 3: Retrieve message bytes from logs
  // TxHash of Swap from SourceNetwork
  const transactionReceipt = await web3.eth.getTransactionReceipt("0x-TxHash");
  const eventTopic = web3.utils.keccak256('MessageSent(bytes)')
  const log = transactionReceipt.logs.find((l) => l.topics[0] === eventTopic)
  const messageBytes = web3.eth.abi.decodeParameters(['bytes'], log.data)[0]
  const messageHash = web3.utils.keccak256(messageBytes);

  console.log(`MessageBytes: ${messageBytes}`)
  console.log(`MessageHash: ${messageHash}`)

  // STEP 4: Fetch attestation signature
  let attestationResponse = {status: 'pending'};
  while(attestationResponse.status != 'complete') {
    const response = await fetch(`https://iris-api.circle.com/attestations/${messageHash}`);
    attestationResponse = await response.json()
    await new Promise(r => setTimeout(r, 2000));
  }
  // attestation can take upto 15 minutes
  const attestationSignature = attestationResponse.attestation;
  console.log(`Signature: ${attestationSignature}`)

  // STEP 5: Using the message bytes and signature recieve the funds on destination chain and address
  web3.setProvider(targetProvider); // Connect web3 to target network mainnet for withdrawal
  const receiveTxGas = await messageTransmitterContract.methods.receiveMessage(messageBytes, attestationSignature).estimateGas();
  const receiveTx = await messageTransmitterContract.methods.receiveMessage(messageBytes, attestationSignature).send({gas: receiveTxGas});
  const receiveTxReceipt = await waitForTransaction(web3, receiveTx.transactionHash);
  console.log('ReceiveTxReceipt: ', receiveTxReceipt)

  if (receiveTxReceipt.status == 1) {
    console.log('CircleCCTP USDCs are successfully deposited to Target Network FundManager:', receiveTxReceipt.transactionHash);
  } else {
    console.log("CircleCCTP USDCS Withdrawal Attestation Transaction failed");
  }
}

const waitForTransaction = async(web3, txHash) => {
  let transactionReceipt = await web3.eth.getTransactionReceipt(txHash);
  while(transactionReceipt != null && transactionReceipt.status === 'FALSE') {
    transactionReceipt = await web3.eth.getTransactionReceipt(txHash);
    await new Promise(r => setTimeout(r, 4000));
  }
  return transactionReceipt;
}

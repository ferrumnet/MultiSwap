    const { ethers } = require('hardhat');
    const { BigNumber } = require('ethers');
    const Web3 = require('web3')
    const messageTransmitterAbi = require('../abis/cctp/MessageTransmitter.json');
    const fiberRouterABI = require("../../artifacts/contracts/multiswap-contracts/FiberRouter.sol/FiberRouter.json").abi;

    const arbiProvider = '';
    const avalancheProvider = '';
  
    const provider = new ethers.providers.JsonRpcProvider(avalancheProvider);
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY0 , provider);

    // Contract addresses
    const fiberRouterAddress = '';
    const avaxUSDC = '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E';
    const arbiUSDC = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
    const targetAddress = '';
    const swapCCTP = true;
    const tokenAddress = avaxUSDC;
    const fiberRouter = new ethers.Contract(fiberRouterAddress, fiberRouterABI, signer);

    async function main() {

    // call this function for circle's attestation to perform withdrawal to cctpFundManager of targetNetwork  
      await circleAttestation();

      const amount = ethers.utils.parseUnits('2', 6); // value with decimal point

      const txWithdraw = await fiberRouter.withdraw(
          tokenAddress,
          targetAddress,
          amount,
          swapCCTP
      );

      // Wait for the transaction receipt
      const txWithdrawReceipt = await txWithdraw.wait();
    
      if (txWithdrawReceipt.status == 1) {
          console.log('CCTP USDC Withdraw is Successful: ', txWithdraw.hash);
      } else {
          console.log("Swap Transaction failed");
      }
  }

  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });

  async function circleAttestation() {
      // Source Sender Network
      const web3 = new Web3(arbiProvider);
      // Add Mumbai private key used for signing transactions
      const avaxSigner = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY0);
      web3.eth.accounts.wallet.add(avaxSigner);

      // Add Arbitrum private key used for signing transactions
      const arbiSigner = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY0);
      web3.eth.accounts.wallet.add(arbiSigner);

      const AVAX_MESSAGE_TRANSMITTER_CONTRACT_ADDRESS = '0x8186359af5f57fbb40c6b14a588d2a59c0c29880';
      const ARBI_MESSAGE_TRANSMITTER_CONTRACT_ADDRESS = '0xC30362313FBBA5cf9163F0bb16a0e01f01A896ca';
      const messageTransmitterContract = new web3.eth.Contract(messageTransmitterAbi, AVAX_MESSAGE_TRANSMITTER_CONTRACT_ADDRESS, {from: avaxSigner.address});

      // STEP 3: Retrieve message bytes from logs
      // TxHash of Swap from SourceNetwork
      const transactionReceipt = await web3.eth.getTransactionReceipt("");
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

      const attestationSignature = attestationResponse.attestation;
      console.log(`Signature: ${attestationSignature}`)

      // STEP 5: Using the message bytes and signature recieve the funds on destination chain and address
      web3.setProvider(avalancheProvider); // Connect web3 to target network mainnet for withdrawal
      const receiveTxGas = await messageTransmitterContract.methods.receiveMessage(messageBytes, attestationSignature).estimateGas();
      const receiveTx = await messageTransmitterContract.methods.receiveMessage(messageBytes, attestationSignature).send({gas: receiveTxGas});
      const receiveTxReceipt = await waitForTransaction(web3, receiveTx.transactionHash);
      console.log('ReceiveTxReceipt: ', receiveTxReceipt)

      console.log('USDC Withdrawn to Receiver on Target Network:', receiveTxReceipt.transactionHash);
  }

  const waitForTransaction = async(web3, txHash) => {
    let transactionReceipt = await web3.eth.getTransactionReceipt(txHash);
    while(transactionReceipt != null && transactionReceipt.status === 'FALSE') {
        transactionReceipt = await web3.eth.getTransactionReceipt(txHash);
        await new Promise(r => setTimeout(r, 4000));
    }
    return transactionReceipt;
  }
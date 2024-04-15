require("dotenv").config();
const Web3 = require('web3')

const tokenMessengerAbi = require('../abis/cctp/TokenMessenger.json');
const messageAbi = require('../abis/cctp/Message.json');
const usdcAbi = require('../abis/Usdc.json');
const messageTransmitterAbi = require('../abis/cctp/MessageTransmitter.json');

const waitForTransaction = async(web3, txHash) => {
    let transactionReceipt = await web3.eth.getTransactionReceipt(txHash);
    while(transactionReceipt != null && transactionReceipt.status === 'FALSE') {
        transactionReceipt = await web3.eth.getTransactionReceipt(txHash);
        await new Promise(r => setTimeout(r, 4000));
    }
    return transactionReceipt;
}

const main = async() => {
    const arbiProvider = '';
    const avalancheProvider = '';

    const web3 = new Web3(arbiProvider);
    
    // Add Mumbai private key used for signing transactions
    const avaxSigner = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY0);
    web3.eth.accounts.wallet.add(avaxSigner);

    // Add Arbitrum private key used for signing transactions
    const arbiSigner = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY0);
    web3.eth.accounts.wallet.add(arbiSigner);

    // Testnet Contract Addresses
    const ARBI_TOKEN_MESSENGER_CONTRACT_ADDRESS = "0x19330d10D9Cc8751218eaf51E8885D058642E08A";
    const USDC_ARBI_CONTRACT_ADDRESS = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
    const AVAX_MESSAGE_TRANSMITTER_CONTRACT_ADDRESS = '0x8186359af5f57fbb40c6b14a588d2a59c0c29880';

    // initialize contracts using address and ABI
    const ethTokenMessengerContract = new web3.eth.Contract(tokenMessengerAbi, ARBI_TOKEN_MESSENGER_CONTRACT_ADDRESS, {from: arbiSigner.address});
    const usdcEthContract = new web3.eth.Contract(usdcAbi, USDC_ARBI_CONTRACT_ADDRESS, {from: arbiSigner.address});
    const avaxMessageTransmitterContract = new web3.eth.Contract(messageTransmitterAbi, AVAX_MESSAGE_TRANSMITTER_CONTRACT_ADDRESS, {from: avaxSigner.address});

    // AVAX destination address
    const mintRecipient = "";

    async function addressToBytes32(address) {
        const bytes32Value = await web3.utils.padRight(web3.utils.asciiToHex(address), 64);
        return bytes32Value;
    }
    const destinationAddressInBytes32 = await addressToBytes32(mintRecipient);

    const ARBI_DESTINATION_DOMAIN = 3;

    // // Amount that will be transferred
    // const amount = 1;

    // // STEP 1: Approve messenger contract to withdraw from our active eth address
    // const approveTxGas = await usdcEthContract.methods.approve(ARBI_TOKEN_MESSENGER_CONTRACT_ADDRESS, amount).estimateGas()
    // const approveTx = await usdcEthContract.methods.approve(ARBI_TOKEN_MESSENGER_CONTRACT_ADDRESS, amount).send({gas: approveTxGas})
    // const approveTxReceipt = await waitForTransaction(web3, approveTx.transactionHash);
    // console.log('ApproveTxReceipt: ', approveTxReceipt)

    // // STEP 2: Burn USDC
    // const burnTxGas = await ethTokenMessengerContract.methods.depositForBurn(amount, ARBI_TESTNET_DESTINATION_DOMAIN, destinationAddressInBytes32, USDC_ARBI_CONTRACT_ADDRESS).estimateGas();
    // const burnTx = await ethTokenMessengerContract.methods.depositForBurn(amount, ARBI_TESTNET_DESTINATION_DOMAIN, destinationAddressInBytes32, USDC_ARBI_CONTRACT_ADDRESS).send({gas: burnTxGas});
    // const burnTxReceipt = await waitForTransaction(web3, burnTx.transactionHash);
    // console.log('BurnTxReceipt: ', burnTxReceipt)

    // STEP 3: Retrieve message bytes from logs
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
    web3.setProvider(avalancheProvider); // Connect web3 to avalanche mainnet
    const receiveTxGas = await avaxMessageTransmitterContract.methods.receiveMessage(messageBytes, attestationSignature).estimateGas();
    const receiveTx = await avaxMessageTransmitterContract.methods.receiveMessage(messageBytes, attestationSignature).send({gas: receiveTxGas});
    const receiveTxReceipt = await waitForTransaction(web3, receiveTx.transactionHash);
    console.log('ReceiveTxReceipt: ', receiveTxReceipt)

    console.log('USDC Withdrawn to Receiver on Target Network:', receiveTxReceipt.transactionHash);
};

main()
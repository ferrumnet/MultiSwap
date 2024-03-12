require("dotenv").config();
const Web3 = require('web3')

const tokenMessengerAbi = require('./abis/cctp/TokenMessenger.json');
const messageAbi = require('./abis/cctp/Message.json');
const usdcAbi = require('./abis/Usdc.json');
const messageTransmitterAbi = require('./abis/cctp/MessageTransmitter.json');

const waitForTransaction = async(web3, txHash) => {
    let transactionReceipt = await web3.eth.getTransactionReceipt(txHash);
    while(transactionReceipt != null && transactionReceipt.status === 'FALSE') {
        transactionReceipt = await web3.eth.getTransactionReceipt(txHash);
        await new Promise(r => setTimeout(r, 4000));
    }
    return transactionReceipt;
}

const main = async() => {
    const arbiRPC = "https://public.stackup.sh/api/v1/node/arbitrum-sepolia";
    const mumbaiRPC = "https://endpoints.omniatech.io/v1/matic/mumbai/public";
    const web3 = new Web3(mumbaiRPC);
    
    // Add Mumbai private key used for signing transactions
    const ethSigner = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY0);
    web3.eth.accounts.wallet.add(ethSigner);

    // Add Arbitrum private key used for signing transactions
    const arbiSigner = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY0);
    web3.eth.accounts.wallet.add(arbiSigner);

    // Testnet Contract Addresses
    const MUMBAI_TOKEN_MESSENGER_CONTRACT_ADDRESS = "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5";
    const USDC_MUMBAI_CONTRACT_ADDRESS = "0x9999f7Fea5938fD3b1E26A12c3f2fb024e194f97";
    const MUMBAI_MESSAGE_CONTRACT_ADDRESS = "0xe09A679F56207EF33F5b9d8fb4499Ec00792eA73"
    const ARBI_MESSAGE_TRANSMITTER_CONTRACT_ADDRESS = '0xaCF1ceeF35caAc005e15888dDb8A3515C41B4872';

    // initialize contracts using address and ABI
    const ethTokenMessengerContract = new web3.eth.Contract(tokenMessengerAbi, MUMBAI_TOKEN_MESSENGER_CONTRACT_ADDRESS, {from: ethSigner.address});
    const usdcEthContract = new web3.eth.Contract(usdcAbi, USDC_MUMBAI_CONTRACT_ADDRESS, {from: ethSigner.address});
    const ethMessageContract = new web3.eth.Contract(messageAbi, MUMBAI_MESSAGE_CONTRACT_ADDRESS, {from: ethSigner.address});
    const arbiMessageTransmitterContract = new web3.eth.Contract(messageTransmitterAbi, ARBI_MESSAGE_TRANSMITTER_CONTRACT_ADDRESS, {from: arbiSigner.address});

    // AVAX destination address
    const mintRecipient = "0xB5d1E1Ff700CFC0c687F1Fc99284E94ab0ef63E5";

    async function addressToBytes32(address) {
        const bytes32Value = await web3.utils.padRight(web3.utils.asciiToHex(address), 64);
        return bytes32Value;
    }
    const destinationAddressInBytes32 = await addressToBytes32(mintRecipient);

    const ARBI_TESTNET_DESTINATION_DOMAIN = 3;

    // Amount that will be transferred
    const amount = 1;

    // // STEP 1: Approve messenger contract to withdraw from our active eth address
    // const approveTxGas = await usdcEthContract.methods.approve(MUMBAI_TOKEN_MESSENGER_CONTRACT_ADDRESS, amount).estimateGas()
    // const approveTx = await usdcEthContract.methods.approve(MUMBAI_TOKEN_MESSENGER_CONTRACT_ADDRESS, amount).send({gas: approveTxGas})
    // const approveTxReceipt = await waitForTransaction(web3, approveTx.transactionHash);
    // console.log('ApproveTxReceipt: ', approveTxReceipt)

    // // STEP 2: Burn USDC
    // const burnTxGas = await ethTokenMessengerContract.methods.depositForBurn(amount, ARBI_TESTNET_DESTINATION_DOMAIN, destinationAddressInBytes32, USDC_MUMBAI_CONTRACT_ADDRESS).estimateGas();
    // const burnTx = await ethTokenMessengerContract.methods.depositForBurn(amount, ARBI_TESTNET_DESTINATION_DOMAIN, destinationAddressInBytes32, USDC_MUMBAI_CONTRACT_ADDRESS).send({gas: burnTxGas});
    // const burnTxReceipt = await waitForTransaction(web3, burnTx.transactionHash);
    // console.log('BurnTxReceipt: ', burnTxReceipt)

    // STEP 3: Retrieve message bytes from logs
    const transactionReceipt = await web3.eth.getTransactionReceipt("0xb1c3a3438cba633ae282ef2abd027b68689961de5799face1e853bf221b6118e");
    const eventTopic = web3.utils.keccak256('MessageSent(bytes)')
    const log = transactionReceipt.logs.find((l) => l.topics[0] === eventTopic)
    const messageBytes = web3.eth.abi.decodeParameters(['bytes'], log.data)[0]
    const messageHash = web3.utils.keccak256(messageBytes);

    console.log(`MessageBytes: ${messageBytes}`)
    console.log(`MessageHash: ${messageHash}`)

    // STEP 4: Fetch attestation signature
    let attestationResponse = {status: 'pending'};
    while(attestationResponse.status != 'complete') {
        const response = await fetch(`https://iris-api-sandbox.circle.com/attestations/${messageHash}`);
        attestationResponse = await response.json()
        await new Promise(r => setTimeout(r, 2000));
    }

    const attestationSignature = attestationResponse.attestation;
    console.log(`Signature: ${attestationSignature}`)

    // STEP 5: Using the message bytes and signature recieve the funds on destination chain and address
    web3.setProvider(arbiRPC); // Connect web3 to ARBITRUM testnet
    const receiveTxGas = await arbiMessageTransmitterContract.methods.receiveMessage(messageBytes, attestationSignature).estimateGas();
    const receiveTx = await arbiMessageTransmitterContract.methods.receiveMessage(messageBytes, attestationSignature).send({gas: receiveTxGas});
    const receiveTxReceipt = await waitForTransaction(web3, receiveTx.transactionHash);
    console.log('ReceiveTxReceipt: ', receiveTxReceipt)
};

main()
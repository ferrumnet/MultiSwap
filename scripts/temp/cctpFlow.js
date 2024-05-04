require("dotenv").config();
const Web3 = require('web3')

const main = async() => {
    const web3 = new Web3("https://eth-mainnet.g.alchemy.com/v2/o5FqyV5Gjw20qUHW8_tgkbo65SYLZEIE");

    // STEP 3: Retrieve message bytes from logs
    const transactionReceipt = await web3.eth.getTransactionReceipt("0x3dc1550553dab7812fba07d88290c2cd60070fd3fa1f72ca2809d2cfb2e10326");
    const eventTopic = web3.utils.keccak256('MessageSent(bytes)')
    const log = transactionReceipt.logs.find((l) => l.topics[0] === eventTopic)
    const messageBytes = web3.eth.abi.decodeParameters(['bytes'], log.data)[0]
    const messageHash = web3.utils.keccak256(messageBytes);

    console.log(`MessageBytes: ${messageBytes}`)
    console.log(`MessageHash: ${messageHash}`)

    // // STEP 4: Fetch attestation signature
    // let attestationResponse = {status: 'pending'};
    // while(attestationResponse.status != 'complete') {
    //     const response = await fetch(`https://iris-api-sandbox.circle.com/attestations/${messageHash}`);
    //     attestationResponse = await response.json()
    //     await new Promise(r => setTimeout(r, 2000));
    // }

    // const attestationSignature = attestationResponse.attestation;
    // console.log(`Signature: ${attestationSignature}`)

    // // STEP 5: Using the message bytes and signature recieve the funds on destination chain and address
    // web3.setProvider(process.env.BASE_TESTNET_RPC); // Connect web3 to AVAX testnet
    // const receiveTxGas = await avaxMessageTransmitterContract.methods.receiveMessage(messageBytes, attestationSignature).estimateGas();
    // const receiveTx = await avaxMessageTransmitterContract.methods.receiveMessage(messageBytes, attestationSignature).send({gas: receiveTxGas});
    // const receiveTxReceipt = await waitForTransaction(web3, receiveTx.transactionHash);
    // console.log('ReceiveTxReceipt: ', receiveTxReceipt)
};

main()
const Web3 = require('web3');
const { AbiItem } = require('web3-utils');
const { default: BigNumber } = require('bignumber.js');
const fundManagerArtifact = require("../../artifacts/contracts/multiswap-contracts/fundManager.sol/fundManager.json");
const usdcABI = require("../../scripts/abis/Usdc.json");

// Initialize Web3 with provider
const web3 = new Web3(new Web3.providers.HttpProvider('https://nd-827-555-321.p2pify.com/fc3eea1a96148177e332fff558188fa9'));
// Add ETH private key used for signing transactions
const signer = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY0);
web3.eth.accounts.wallet.add(signer);

// // arbitrum
const fundManagerAddress = '0x806270D6CcbAd841B7AaDf571dC771B68F9dbAB5';
const usdcContractAddress = '0xaf88d065e77c8cc2239327c5edb3a432268e5831';
const endpoint = '0x1a44076050125825900e736c501f859c50fE728c';
const stargateUSDCPool = '0xe8CDF27AcD73a434D661C84887215F7598e7d0d3';
const dstChainID = 43114; // avalanche
const dstEid = 30106;   // avalanche
const targetStargateComposer = '0x77fbf08c7E5B4944D1a35F6501B399117cdf676C';

// // avalanche 
// const fundManagerAddress = '';
// const usdcContractAddress = '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e';
// const endpoint = '0x1a44076050125825900e736c501f859c50fE728c';
// const stargateUSDCPool = '0x5634c4a5FEd09819E3c46D86A965Dd9447d86e47';

const fundManager = new web3.eth.Contract(fundManagerArtifact.abi, fundManagerAddress, {from: signer.address});
const usdcContract = new web3.eth.Contract(usdcABI, usdcContractAddress, {from: signer.address});

const waitForTransaction = async(web3, txHash) => {
    let transactionReceipt = await web3.eth.getTransactionReceipt(txHash);
    while(transactionReceipt != null && transactionReceipt.status === 'FALSE') {
        transactionReceipt = await web3.eth.getTransactionReceipt(txHash);
        await new Promise(r => setTimeout(r, 4000));
    }
    return transactionReceipt;
}

// Call setSenderConfig function for setting the Sender's Configs
async function setSenderConfig(newStargateAddress, newUsdcAddress, newEndpoint) {
    const gasPrice = await web3.eth.getGasPrice();
    const gasEstimate = await fundManager.methods.initConfig(newStargateAddress, newUsdcAddress, newEndpoint).estimateGas();
    const data = fundManager.methods.initConfig(newStargateAddress, newUsdcAddress, newEndpoint).encodeABI();

    const tx = {
        from: signer.address,
        to: fundManagerAddress,
        gas: gasEstimate,
        gasPrice: gasPrice,
        data: data
    };

    const signedTx = await web3.eth.accounts.signTransaction(tx, signer.privateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    console.log('Transaction receipt For initConfig:', receipt);
}

// Call setSenderConfig function for setting the Sender's Configs
async function setBounds(_bounds) {
    const gasPrice = await web3.eth.getGasPrice();
    const gasEstimate = await fundManager.methods.setBounds(_bounds).estimateGas();
    const data = fundManager.methods.setBounds(_bounds).encodeABI();

    const tx = {
        from: signer.address,
        to: fundManagerAddress,
        gas: gasEstimate,
        gasPrice: gasPrice,
        data: data
    };

    const signedTx = await web3.eth.accounts.signTransaction(tx, signer.privateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    console.log('Transaction receipt for setBounds:', receipt);
}

async function setStgTargetNetwork(_chainID, _dstEid, _targetStargateComposer) {
    const gasPrice = await web3.eth.getGasPrice();
    const gasEstimate = await fundManager.methods.setStgTargetNetwork(_chainID, _dstEid, _targetStargateComposer).estimateGas();
    const data = fundManager.methods.setStgTargetNetwork(_chainID, _dstEid, _targetStargateComposer).encodeABI();

    const tx = {
        from: signer.address,
        to: fundManagerAddress,
        gas: gasEstimate,
        gasPrice: gasPrice,
        data: data
    };

    const signedTx = await web3.eth.accounts.signTransaction(tx, signer.privateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    console.log('Transaction receipt for setStgTargetNetwork:', receipt);
}

// Call prepareTakeTaxi function for estimating gas fee etc
async function prepareTakeTaxi(dstEid, amount, composer, composeMsg) {
    console.log("entered")
    const result = await fundManager.methods.prepareTakeTaxi(dstEid, amount, composer, composeMsg).call();
    const messagingFee = result[2][0];
    console.log(messagingFee)
    return messagingFee;
}

// Call swapUSDC function for performing the swap
async function swapUSDC(dstEid, amount, composerAddress, composeMsg) {
    const gasPrice = await web3.eth.getGasPrice();
    // Approve fundManager to spend USDC tokens
    const approvalTxGas = await usdcContract.methods.approve(fundManagerAddress, amount).estimateGas();
    const approvalTx = await usdcContract.methods.approve(fundManagerAddress, amount).send({gas: approvalTxGas}); 
    const approvalTxReceipt = await waitForTransaction(web3, approvalTx.transactionHash);
    console.log('approvalTxReceipt: ', approvalTx.transactionHash);

    const messagingFee = await prepareTakeTaxi(dstEid, amount.toString(), composerAddress, composeMsg);
    console.log("Stargate Native Fee Paid by User:", messagingFee);
    const swapTxGas = await fundManager.methods.swapUSDC(dstEid, amount.toString(), composerAddress, composeMsg).estimateGas({value: messagingFee});
    const swapTx = await fundManager.methods.swapUSDC(dstEid, amount.toString(), composerAddress, composeMsg).send({value: messagingFee, gas: swapTxGas});
    await waitForTransaction(web3, swapTx.transactionHash);
    console.log('swapTxReceipt: ', swapTx.transactionHash);
}

const destinationEid = 30106;
const amount = 1000 // 0.1 cent
const composerAddress = '0x77fbf08c7E5B4944D1a35F6501B399117cdf676C'; // Target network's fundManager address
const targetAddress = "0xdCd60Be5b153d1884e1E6E8C23145D6f3546315e";
// Convert targetAddress to buffer (remove "0x" prefix)
const targetAddressBuffer = Buffer.from(targetAddress.slice(2), 'hex');

// Convert amountIn to 32-byte buffer (uint256 format)
const amountInBuffer = Buffer.alloc(32);
amountInBuffer.writeBigInt64BE(BigInt(amount), 0);

// Concatenate buffers to get the encoded data
const encodedData = Buffer.concat([targetAddressBuffer, amountInBuffer]);

// Convert encoded data to hexadecimal string
const composeMsg = '0x' + encodedData.toString('hex');

console.log(composeMsg); // Outputs the hexadecimal representation


// swapUSDC(destinationEid, amountToSend, composerAddress, composeMessage);

// // Setter Function calls
// setSenderConfig(stargateUSDCPool,usdcContractAddress, endpoint);
// setBounds(1);
// setStgTargetNetwork(dstChainID, dstEid, targetStargateComposer)
prepareTakeTaxi(destinationEid, amount, composerAddress, composeMsg)
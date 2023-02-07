
const Web3 = require('web3')
const NAME = "FERRUM_TOKEN_BRIDGE_POOL";
const VERSION = "000.004";

function domainSeparator(eth,
    contractName,
    contractVersion,
    netId,
    contractAddress) {
    const hashedName = Web3.utils.keccak256(Web3.utils.utf8ToHex(contractName));
    const hashedVersion = Web3.utils.keccak256(Web3.utils.utf8ToHex(contractVersion));
    const typeHash = Web3.utils.keccak256(
        Web3.utils.utf8ToHex("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"));

    return Web3.utils.keccak256(
        eth.abi.encodeParameters(
            ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
            [typeHash, hashedName, hashedVersion, netId, contractAddress]
        )
    );
}

function produecSignaturewithdrawHash(netId,
    contractAddress, token, payee, amountInt, salt) {
    const web3 = new Web3();
    const methodHash = Web3.utils.keccak256(
        Web3.utils.utf8ToHex('WithdrawSigned(address token,address payee,uint256 amount,bytes32 salt)'));

    const params = ['bytes32', 'address', 'address', 'uint256', 'bytes32'];
    const structure = web3.eth.abi.encodeParameters(params, [methodHash, token, payee, amountInt, salt]);
    const structureHash = Web3.utils.keccak256(structure);
    const ds = domainSeparator(web3.eth, NAME, VERSION, netId, contractAddress);
    // console.log('DETAILS ARE:', { netId, methodHash, structureHash, ds })
    return Web3.utils.soliditySha3("\x19\x01", ds, structureHash);
}


function fixSig(sig) {
    const rs = sig.substring(0, sig.length - 2);
    let v = sig.substring(sig.length - 2);
    if (v === '00' || v === '37' || v === '25') {
        v = '1b'
    } else if (v === '01' || v === '38' || v === '26') {
        v = '1c'
    }
    return rs + v;
}

module.exports = {
    domainSeparator,
    produecSignaturewithdrawHash,
    fixSig
}
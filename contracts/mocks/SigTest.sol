// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "hardhat/console.sol";

contract SigTest {
    using ECDSA for bytes32;

    bytes32 constant WITHDRAW_SIGNED_WITH_SWAP_METHOD =
        keccak256(
            "withdrawSignedAndSwapRouter(address to,uint256 amountIn,uint256 minAmountOut,address foundryToken,address targetToken,address router,bytes32 routerCalldata,bytes32 salt,uint256 expiry)"
        );


    function checkSig(bytes memory sig) external pure {
        

        bytes32 hashedName = keccak256(bytes("FUND_MANAGER"));
        bytes32 hashedVersion = keccak256(bytes("000.004"));
        bytes32 typeHash = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");

        bytes32 domainSeparator = keccak256(abi.encode(
            typeHash,
            hashedName,
            hashedVersion,
            42161,
            0x3E2aDfc6e9929FaEA8F3a2614145B7D55c130FFB
        ));

        bytes32 message =  keccak256(
                abi.encode(
                    WITHDRAW_SIGNED_WITH_SWAP_METHOD,
                    0xeEDFDd620629C7432970d22488124fC92Ad6D426,
                    10000,
                    9247230027495409356,
                    0xaf88d065e77c8cC2239327C5EDb3A432268e5831,
                    0x9f6AbbF0Ba6B5bfa27f4deb6597CC6Ec20573FDA,
                    0x111111125421cA6dc452d289314280a0f8842A65,
                    keccak256(abi.encodePacked("0x07ed2379000000000000000000000000e37e799d5077682fa0a244d46e5649f71457bd09000000000000000000000000af88d065e77c8cc2239327c5edb3a432268e58310000000000000000000000009f6abbf0ba6b5bfa27f4deb6597cc6ec20573fda000000000000000000000000e37e799d5077682fa0a244d46e5649f71457bd09000000000000000000000000eedfdd620629c7432970d22488124fc92ad6d426000000000000000000000000000000000000000000000000000000000007a1200000000000000000000000000000000000000000000000008054c2b7513086cc00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000015400000000000000000000000000000000000000000000013600010800001a0020d6bdbf78af88d065e77c8cc2239327c5edb3a432268e583100a007e5c0d20000000000000000000000000000000000000000000000000000ca00006302a00000000000000000000000000000000000000000000000000000000000000001ee63c1e580b1026b8e7276e7ac75410f1fcbbe21796e8f7526af88d065e77c8cc2239327c5edb3a432268e58313fec70f319a4145eba17765ae0c64b2232fe5bae00206ae40711b8002dc6c03fec70f319a4145eba17765ae0c64b2232fe5bae111111125421ca6dc452d289314280a0f8842a65000000000000000000000000000000000000000000000000000000000000000182af49447d8a07e3bd95bd0d56f35241523fbab10020d6bdbf789f6abbf0ba6b5bfa27f4deb6597cc6ec20573fda111111125421ca6dc452d289314280a0f8842a650000000000000000000000007c2ad3dd")),
                    0x1efbd5538ca2e0037c403c9aa400ff617decfffbb021320cd0ab289cf1780745,
                    1715277739
                )
            );

        console.logBytes32(message);

        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, message));

        address signer = ECDSA.recover(digest, sig);
        console.log(signer);
    }
}

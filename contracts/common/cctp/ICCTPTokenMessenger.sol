// SPDX-License-Identifier: Apache-2.0
 pragma solidity ^0.8.24;

interface ICCTPTokenMessenger {
    function depositForBurn(
        uint256 amount,
        uint32 destinationDomain,
        bytes32 mintRecipient,
        address burnToken
    ) external returns (uint64 nonce);

    function depositForBurnWithCaller(
        uint256 amount,
        uint32 destinationDomain,
        bytes32 mintRecipient,
        address burnToken,
        bytes32 destinationCaller
    ) external returns (uint64 nonce);

    function replaceDepositForBurn(
        bytes calldata originalMessage,
        bytes calldata originalAttestation,
        bytes32 newDestinationCaller,
        bytes32 newMintRecipient
    ) external;

    function handleReceiveMessage(
        uint32 remoteDomain,
        bytes32 sender,
        bytes calldata messageBody
    ) external returns (bool);

    function addRemoteTokenMessenger(uint32 domain, bytes32 tokenMessenger) external;

    function removeRemoteTokenMessenger(uint32 domain) external;

    function addLocalMinter(address newLocalMinter) external;

    function removeLocalMinter() external;

    function localMessageTransmitter() external view returns (address);

    function messageBodyVersion() external view returns (uint32);

    function localMinter() external view returns (address);

    function remoteTokenMessengers(uint32 domain) external view returns (bytes32);
}

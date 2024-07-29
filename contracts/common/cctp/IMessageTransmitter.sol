// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

interface IMessageTransmitter {
    event MessageSent(bytes message);

    event MessageReceived(
        address indexed caller,
        uint32 sourceDomain,
        uint64 indexed nonce,
        bytes32 sender,
        bytes messageBody
    );

    event MaxMessageBodySizeUpdated(uint256 newMaxMessageBodySize);

    function sendMessage(
        uint32 destinationDomain,
        bytes32 recipient,
        bytes calldata messageBody
    ) external returns (uint64);

    function replaceMessage(
        bytes calldata originalMessage,
        bytes calldata originalAttestation,
        bytes calldata newMessageBody,
        bytes32 newDestinationCaller
    ) external;

    function sendMessageWithCaller(
        uint32 destinationDomain,
        bytes32 recipient,
        bytes32 destinationCaller,
        bytes calldata messageBody
    ) external returns (uint64);

    function receiveMessage(
        bytes calldata message,
        bytes calldata attestation
    ) external returns (bool success);

    function setMaxMessageBodySize(uint256 newMaxMessageBodySize) external;

    function localDomain() external view returns (uint32);

    function version() external view returns (uint32);

    function maxMessageBodySize() external view returns (uint256);

    function nextAvailableNonce() external view returns (uint64);
}

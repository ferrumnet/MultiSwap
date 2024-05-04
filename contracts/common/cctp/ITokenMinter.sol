// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

interface ITokenMinter {
    
    function mint(
        uint32 sourceDomain,
        bytes32 burnToken,
        address to,
        uint256 amount
    ) external returns (address mintToken);

    function burn(address burnToken, uint256 burnAmount) external;

    function addLocalTokenMessenger(address newLocalTokenMessenger) external;

    function removeLocalTokenMessenger() external;

    function setTokenController(address newTokenController) external;

    function getLocalToken(uint32 remoteDomain, bytes32 remoteToken)
        external
        view
        returns (address);
}


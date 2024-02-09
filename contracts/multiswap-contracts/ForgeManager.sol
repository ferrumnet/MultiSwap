// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "./FundManager.sol";

contract ForgeFundManager is FundManager {

  /**
     * @dev Constructor that sets the Test Signer address for ForgeFundManager
     * @note PrivateKey of the Test Signer to be added here for Devs Reference
     */
    constructor() {
        super.addSigner(0x);
    }
}
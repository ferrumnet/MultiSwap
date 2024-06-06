// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./CCTPFundManager.sol";

contract ForgeCCTPFundManager is CCTPFundManager {

  /**
     * @dev Constructor that sets the Test Signer address for ForgeFundManager
     * PrivateKey of the Test Signer to be added here for Devs Reference
     * fc4a1eb6778756a953b188220062d33e3eaabd85099bef1a61da1053ae3d0c63
     */
    constructor() {
        super.addSigner(0xb1Ea8634f56E17DCD2D5b66214507B7f493E12aD);
    }
}

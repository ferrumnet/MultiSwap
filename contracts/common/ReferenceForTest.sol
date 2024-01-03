// SPDX-License-Identifier: MIT

/**
 * This file is to allow refencing the imported contracts, in the test code, because it will trigger
 * hardhat to create the relavant artifacts.
 */

pragma solidity ^0.8.0;

import "./FerrumDeployer.sol";

contract FerrumDeployer_ is FerrumDeployer {}
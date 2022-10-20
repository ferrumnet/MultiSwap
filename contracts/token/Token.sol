// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract Token is ERC20Upgradeable {

    //initialize function is constructor for upgradeable smart contract 
    function initialize(string memory _name, string memory _symbol, uint256 initialSupply) public initializer {
        __ERC20_init(_name, _symbol);
        _mint(msg.sender, initialSupply);
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../common/WithAdmin.sol";
import "../common/SafeAmount.sol";
import "../common/tokenReceiveable.sol";

abstract contract LiquidityManagerRole is WithAdmin, TokenReceivable {
    using SafeERC20 for IERC20;
    address public liquidityManager;
    address public liquidityManagerBot;
    address public withdrawalAddress;

    event LiquidityAddedByManager(address token, uint256 amount);
    event LiquidityRemovedByManager(address token, uint256 amount, address withdrawalAddress);

  /**
     * @dev Modifier that allows only the designated liquidity managers to execute the function.
     * It checks if the sender is either `liquidityManager` or `liquidityManagerBot`.
     * @notice Ensure that `liquidityManager` and `liquidityManagerBot` are set before using this modifier.
     */
    modifier onlyLiquidityManager() {
        require(
            msg.sender == liquidityManager || msg.sender == liquidityManagerBot,
            "FM: Only liquidity managers"
        );
        _;
    }

    /**
     * @dev Sets the addresses of liquidity managers
     * @param _liquidityManager The primary liquidity manager address
     * @param _liquidityManagerBot The secondary liquidity manager address
     */
    function setLiquidityManagers(address _liquidityManager, address _liquidityManagerBot) external onlyOwner {
        require(_liquidityManager != address(0), "FM: Bad liquidity manager");
        require(_liquidityManagerBot != address(0), "FM: Bad liquidity manager bot");

        liquidityManager = _liquidityManager;
        liquidityManagerBot = _liquidityManagerBot;
    }

    /**
     * @dev Sets the address for withdrawal of liquidity
     * @param _withdrawalAddress The liquidity withdraw address
     */
    function setWithdrawalAddress(address _withdrawalAddress) external onlyOwner {
        withdrawalAddress = _withdrawalAddress;
    }

    /**
     * @dev Adds specified liquidity for the given token
     * @param token Token address for liquidity addition
     * @param amount Amount of tokens to be added
     */
    function addLiquidityByManager(address token, uint256 amount) external onlyLiquidityManager {
        require(amount != 0, "FM: Amount must be positive");
        require(token != address(0), "FM: Bad token");
        // Transfer tokens from the sender to the FundManager
        SafeAmount.safeTransferFrom(token, msg.sender, address(this), amount);
        // Update the inventory using sync
        amount = TokenReceivable.sync(token);
        emit LiquidityAddedByManager(token, amount);
    }

    /**
     * @dev Removes specified liquidity for the given token
     * @param token Token address for liquidity removal
     * @param amount Amount of tokens to be removed
     * @return Actual amount of tokens removed
     */
    function removeLiquidityByManager(address token, uint256 amount) external onlyLiquidityManager returns (uint256) {
        require(amount != 0, "FM: Amount must be positive");
        require(token != address(0), "FM: Bad token");
        // Check the Token balance of FundManager
        require(IERC20(token).balanceOf(address(this)) >= amount, "FM: Insufficient balance");
        // Transfer tokens to the withdrawal address using sendToken
        TokenReceivable.sendToken(token, withdrawalAddress, amount);
        emit LiquidityRemovedByManager(token, amount, withdrawalAddress);
        return amount;
    }

}

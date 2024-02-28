// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../common/WithAdmin.sol";

abstract contract LiquidityManagerRole is WithAdmin {
    using SafeERC20 for IERC20;
    address public liquidityManager;
    address public liquidityManagerBot;
    address public withdrawalAddress;
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
     * @dev Removes specified liquidity for the given token
     * @param token Token address for liquidity removal
     * @param amount Amount of tokens to be removed
     * @return Actual amount of tokens removed
     */
    function removeLiquidityByManager(address token, uint256 amount) external onlyLiquidityManager returns (uint256) {
        IERC20(token).safeTransfer(withdrawalAddress, amount);
        emit LiquidityRemovedByManager(token, amount, withdrawalAddress);
        return amount;
    }
}

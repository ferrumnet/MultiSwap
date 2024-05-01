// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


// Simple mock contract to simulate some aggregator/dex behaviour
// Will always swap specified amountIn inToken for amountOut outToken
contract SwapRouter {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOut,
        address inToken,
        address outToken,
        address to
    ) external returns (uint256) {
        IERC20(inToken).transferFrom(msg.sender, address(this), amountIn);
        IERC20(outToken).transfer(to, amountOut);
        return amountOut;
    }
}

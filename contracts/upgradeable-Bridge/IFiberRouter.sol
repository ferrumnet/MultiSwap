// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

interface IFiberRouter {
    /**
     * @notice Withdraws funds based on a multisig
     * @dev For signature swapToToken must be the same as token
     * @param token The token to withdraw
     * @param payee Address for where to send the tokens to
     * @param amount The amount
     * @param salt The unique identifier for the transaction
     * @param expiry The expiry time for the transaction
     * @param multiSignature The multisig validator signature
     */
    function withdrawSigned(
        address token,
        address payee,
        uint256 amount,
        bytes32 salt,
        uint256 expiry,
        bytes memory multiSignature
    ) external;

    /**
     * @notice Withdraws funds and swaps to a new token
     * @param to Address for where to send the tokens to
     * @param amountIn The amount to swap
     * @param amountOut Minimum amount out expected from the swap
     * @param foundryToken The token to be swapped from
     * @param targetToken The token to be swapped to
     * @param oneInchData Data required for the oneInch swap
     * @param salt The unique identifier for the transaction
     * @param expiry The expiry time for the transaction
     * @param multiSignature The multisig validator signature
     */
    function withdrawSignedAndSwapOneInch(
        address payable to,
        uint256 amountIn,
        uint256 amountOut,
        address foundryToken,
        address targetToken,
        bytes memory oneInchData,
        bytes32 salt,
        uint256 expiry,
        bytes memory multiSignature
    ) external;
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "./IFiberRouter.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 @author The ferrum network.
 @title This is a gasEstimation contract named as MultiswapForge.
*/
contract MultiswapForge is Ownable {
    address public router;

    /**
     * @dev Constructor that sets the router address.
     * @param _router Address of the Fiber Router contract.
     */
    constructor(address _router) {
        require(_router != address(0), "Swap router address cannot be zero");
        router = _router;
    }

    /**
     @notice Sets the fiber router contract.
     @param _router The fiber router
     */
    function setRouter(address _router) external onlyOwner {
        require(_router != address(0), "Swap router address cannot be zero");
        router = _router;
    }

    /**
     * @notice Estimates gas for the withdrawal transaction and reverts
     * @param token The token address
     * @param payee The payee address
     * @param amount The withdrawal amount
     * @param salt The salt value
     * @param expiry The expiry timestamp
     * @param multiSignature The multiSignature data
     * @return The gas used
     */
    function estimateGasForWithdrawSigned(
        address token,
        address payee,
        uint256 amount,
        bytes32 salt,
        uint256 expiry,
        bytes memory multiSignature
    ) external returns (uint256) {
        // Validation checks
        require(token != address(0), "Token address cannot be zero");
        require(payee != address(0), "Payee address cannot be zero");
        require(amount != 0, "Amount must be greater than zero");
        require(salt > bytes32(0), "Salt must be greater than zero bytes");

        // Create a copy of the current context
        uint256 initialGas = gasleft();

        // Simulate the withdrawal transaction
        IFiberRouter(router).withdrawSigned{gas: gasleft()}(
            token,  
            payee,
            amount,
            salt,
            expiry,
            multiSignature
        );

        // Calculate the gas used during the execution
        uint256 gasUsed = initialGas - gasleft();

        // Revert to mimic the transaction but capture the gas estimation
        revert(
            string(
                abi.encodePacked(
                    "Estimation completed; gas used: ",
                    uintToString(gasUsed)
                )
            )
        );
    }

    /**
     * @notice Estimates gas for the withdrawSignedAndSwapOneInch transaction and reverts
     * @param to The address to send the tokens to
     * @param amountIn The amount of tokens to swap
     * @param amountOut The minimum amount of tokens to receive from the swap
     * @param foundryToken The token to be swapped from
     * @param targetToken The token to be swapped to
     * @param oneInchData Data required for the oneInch swap
     * @param salt The salt value
     * @param expiry The expiry timestamp
     * @param multiSignature The multiSignature data
     * @return The gas used
     */
    function estimateGasForWithdrawSignedAndSwapOneInch(
        address payable to,
        uint256 amountIn,
        uint256 amountOut,
        address foundryToken,
        address targetToken,
        bytes memory oneInchData,
        bytes32 salt,
        uint256 expiry,
        bytes memory multiSignature
    ) external returns (uint256) {
        // Validation checks
        require(foundryToken != address(0), "Bad Token Address");
        require(
            targetToken != address(0),
            "Target token address cannot be zero"
        );
        require(amountIn != 0, "Amount in must be greater than zero");
        require(amountOut != 0, "Amount out minimum must be greater than zero");

        // Create a copy of the current context
        uint256 initialGas = gasleft();

        // Simulate the withdrawSignedAndSwapOneInch transaction
        IFiberRouter(router).withdrawSignedAndSwapOneInch{gas: gasleft()}(
            to,
            amountIn,
            amountOut,
            foundryToken,
            targetToken,
            oneInchData,
            salt,
            expiry,
            multiSignature
        );

        // Calculate the gas used during the execution
        uint256 gasUsed = initialGas - gasleft();

        // Revert to mimic the transaction but capture the gas estimation
        revert(
            string(
                abi.encodePacked(
                    "Estimation completed; gas used: ",
                    uintToString(gasUsed)
                )
            )
        );
    }

    // Helper function to convert uint to string
    function uintToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}

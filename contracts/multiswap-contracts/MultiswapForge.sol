// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "./FiberRouter.sol";

contract MultiswapForge is FiberRouter {

    // set ForgeFundManager address
    function setPool(address _pool) public override onlyOwner {
        super.setPool(_pool);
    }

    // setOneInchRouter address for testing
    function setOneInchAggregatorRouter(address _newRouterAddress)
        public
        override
        onlyOwner
    {
        super.setOneInchAggregatorRouter(_newRouterAddress);
    }

    constructor() FiberRouter() {
    }

    // Override and revert the 'setGasWallet' function
    function setGasWallet(address payable _gasWallet) external override onlyOwner 
    {
        revert("Function is reverted");
    }

    // Override and revert the 'swap' function
    function swap(
        address token,
        uint256 amount,
        uint256 targetNetwork,
        address targetToken,
        address targetAddress,
        bytes32 withdrawalData
    ) external override payable nonReentrant {
        revert("Function is reverted");
    }

    // Override and revert the 'nonEvmSwap' function
    function nonEvmSwap(
        address token,
        uint256 amount,
        string memory targetNetwork,
        string memory targetToken,
        string memory targetAddress,
        bytes32 withdrawalData
    ) external override nonReentrant {
        revert("Function is reverted");
    }

    // Override and revert the 'swapAndCrossOneInch' function
    function swapAndCrossOneInch(
        uint256 amountIn,
        uint256 amountOut,
        uint256 crossTargetNetwork,
        address crossTargetToken,
        address crossTargetAddress,
        bytes memory oneInchData,
        address fromToken,
        address foundryToken,
        bytes32 withdrawalData
    ) external override payable nonReentrant {
        revert("Function is reverted");
    }

    // Override and revert the 'swapAndCrossOneInchETH' function
    function swapAndCrossOneInchETH(
        uint256 amountOut,
        uint256 crossTargetNetwork,
        address crossTargetToken,
        address crossTargetAddress,
        bytes memory oneInchData,
        address foundryToken,
        bytes32 withdrawalData,
        uint256 gasFee
    ) external payable override {
        revert("Function is reverted");
    }

    // Inherit withdrawSigned function
    function withdrawSigned(
        address token,
        address payee,
        uint256 amount,
        bytes32 salt,
        uint256 expiry,
        bytes memory multiSignature
    ) public override {
        // Create a copy of the current context
        uint256 initialGas = gasleft();

        // Call the original function from FiberRouter
        super.withdrawSigned(
            token,
            payee,
            amount,
            salt,
            expiry,
            multiSignature
        );

        // Calculate the gas used during the execution
        uint256 gasUsed = initialGas - gasleft();

        // Revert with a message indicating gas usage
        revert(
            string(
                abi.encodePacked(
                    "Estimation completed; gas used: ",
                    uintToString(gasUsed)
                )
            )
        );
    }

    // Inherit withdrawSignedAndSwapOneInch function
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
    ) public override nonReentrant {
        // Create a copy of the current context
        uint256 initialGas = gasleft();

        // Call the original function from FiberRouter
        super.withdrawSignedAndSwapOneInch(
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

        // Revert with a message indicating gas usage
        revert(
            string(
                abi.encodePacked(
                    "Estimation completed; gas used: ",
                    uintToString(gasUsed)
                )
            )
        );
    }

    // Helper function to convert a uint256 to a string
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

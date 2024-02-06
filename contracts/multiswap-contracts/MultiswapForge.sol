// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "./FiberRouter.sol";

contract MultiSwapForge is FiberRouter {
    constructor() FiberRouter() {
    }

    // Override and revert the 'setPool' function
    function setPool(address _pool) external override onlyOwner {
        revert("Not Supported");
    }

    // Override and revert the 'setOneInchAggregatorRouter' function
    function setOneInchAggregatorRouter(address _newRouterAddress)
        external
        override
        onlyOwner
    {
        revert("Not Supported");
    }

     // Override and revert the 'setGasWallet' function
    function setGasWallet(address payable _gasWallet) external override onlyOwner 
    {
        revert("Not Supported");
    }

    // Override and revert the 'swap' function
    function swap(
        address token,
        uint256 amount,
        uint256 targetNetwork,
        address targetToken,
        address targetAddress,
        bytes32 withdrawalData
    ) external payable override nonReentrant {
        revert("Not Supported");
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
        revert("Not Supported");
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
    ) external payable override nonReentrant {
        revert("Not Supported");
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
        revert("Not Supported");
    }

    // Override and revert the 'withdrawSigned' function
    function withdrawSigned(
        address token,
        address payee,
        uint256 amount,
        bytes32 salt,
        uint256 expiry,
        bytes memory multiSignature
    ) public override {
        revert("Not Supported");
    }
    // This function is only used specifically for GasEstimation & Simulation of withdrawSigned
    function withdrawSignedForGasEstimation(
        address token,
        address payee,
        uint256 amount,
        bytes32 salt,
        uint256 expiry,
        bytes memory multiSignature
    ) external {
        super.withdrawSigned(
            token,
            payee,
            amount,
            salt,
            expiry,
            multiSignature
        );
        revert("Not Supported");
    }

    // Function that returns the gas estimation from backend using estimateGas()
    function estimateGasForWithdrawSigned(
        address token,
        address payee,
        uint256 amount,
        bytes32 salt,
        uint256 expiry,
        bytes memory multiSignature
    ) external {
        // Encode the function call data with selector only
        bytes4 selector = bytes4(
            keccak256(
                "withdrawSignedForGasEstimation(address,address,uint256,bytes32,uint256,bytes)"
            )
        );
        bytes memory data = abi.encodeWithSelector(
            selector,
            token,
            payee,
            amount,
            salt,
            expiry,
            multiSignature
        );
        address(this).call(data);
    }

    // Override and revert the 'withdrawSignedAndSwapOneInch' function
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
    ) public override {
       revert("Not Supported");
    }
    // This function is only used specifically for GasEstimation & Simulation of withdrawSignedAndSwapOneInch
    function withdrawSignedAndSwapOneInchForGasEstimation(
        address payable to,
        uint256 amountIn,
        uint256 amountOut,
        address foundryToken,
        address targetToken,
        bytes memory oneInchData,
        bytes32 salt,
        uint256 expiry,
        bytes memory multiSignature
    ) external {
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

       revert("Not Supported");
    }

    // Function that returns the gas estimation from backend using estimateGas()
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
    ) external {
        // Encode the function call data with selector only
        bytes4 selector = bytes4(
            keccak256(
                "withdrawSignedAndSwapOneInchForGasEstimation(address,uint256,uint256,address,address,bytes,bytes32,uint256,bytes)"
            )
        );
        bytes memory data = abi.encodeWithSelector(
            selector,
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
        address(this).call(data);
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

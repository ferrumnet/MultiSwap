// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "./FiberRouter.sol";

contract MultiSwapForge is FiberRouter {
    constructor() 
        FiberRouter() {
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
        // Use this.withdrawSigned.selector to get the selector directly
        bytes4 selector = this.withdrawSignedForGasEstimation.selector;
        bytes memory data = abi.encodeWithSelector(
            selector,
            token,
            payee,
            amount,
            salt,
            expiry,
            multiSignature
        );

        (bool success, ) =   address(this).call(data);

        require(success == false);
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
        // Use this.withdrawSigned.selector to get the selector directly
        bytes4 selector = this.withdrawSignedAndSwapOneInchForGasEstimation.selector;

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

        (bool success, ) =   address(this).call(data);

        require(success == false);
    }
}

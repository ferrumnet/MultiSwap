// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;


contract OmniRouter {
    string public constant NAME = "OMNI_ROUTER";
    string public constant VERSION = "000.001";


    


    function omniSwapSigned() {
        // Basically same logic as current swapSigned in FiberRouter
        // 1. Take funds from user and put in FundManager
        // 2. Just need extra param which will tell FiberEngine backend that we should call omniWithdrawSignedAndSwap() instead of 
        // normal withdrawSignedAndSwap() on the other side
    }



    function omniWithdrawSignedAndSwap() {
        // Basically same logic as current withdrawSignedAndSwap in FiberRouter:
        // 1. Withdraw from FundManager
        // 2. Swap on aggregator
        ...
        ...

        // With added step of sending message to Axelar's interchain token service:
        IInterchainTokenStandard(toToken).interchainTransfer{value: msg.value}(destinationChain, abi.encodePacked(recipient), aount, "");
    }



    // callback from Axelar when transferring tokens between chains. Useful for us when doing:
    // 1. source FRM -> dest FRM: using Axelar's interchain token service
    // 2. dest FRM -> dest USDC: As part of step 1, Axelar will also make a call to this contract, and execute any logic in _executeWithInterchainToken() function
    // 3. dest USDC -> source USDC: Standard FiberEngine flow, resulting in USDC transferred to user's wallet
    function _executeWithInterchainToken( 
        bytes32,
        string calldata,
        bytes calldata,
        bytes calldata data,
        bytes32,
        address token,
        uint256 amount
    ) internal override {
        // decode data with abi.decode
        (
            address toToken,
            uint256 targetChainId,
            address recipient,
            address router,
            address routerCalldata
        ) = abi.decode(data, (...));

        // Swap on aggregator
        _swapAndCheckSlippage(...);
        

        // Send to FundManager, and emit Swap() event so FiberEngine can pick it up
        SafeAmount.safeTransferFrom(token, address(this), fundManager, amount);

        emit Swap(...)
    }
}

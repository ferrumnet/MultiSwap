// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../common/tokenReceiveable.sol";
import "../common/SafeAmount.sol";
import "../common/IWETH.sol";
import "./FundManager.sol";
import "./CCTPFundManager.sol";
import "./FeeDistributor.sol";

/**
 @author The ferrum network.
 @title This is a routing contract named as FiberRouter.
*/
contract FiberRouter is Ownable, TokenReceivable, FeeDistributor {
    using SafeERC20 for IERC20;
    address private constant NATIVE_CURRENCY = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    address public weth;
    address public fundManager;
    address public cctpFundManager;
    address payable public gasWallet;
    mapping(bytes32 => bool) private routerAllowList;
    mapping(uint256 => TargetNetwork) public targetNetworks;

    struct SwapCrossData {
        uint256 targetNetwork;
        address targetToken;
        address targetAddress;
    }

    struct TargetNetwork {
        uint32 targetNetworkDomain;
        address targetFundManager;
    }

    event Swap(
        address sourceToken,
        address targetToken,
        uint256 sourceChainId,
        uint256 targetChainId,
        uint256 sourceAmount,
        address sourceAddress,
        address targetAddress,
        uint256 settledAmount,
        bytes32 withdrawalData,
        uint256 gasAmount,
        uint256 depositNonce
    );

    event SwapSameNetwork(
        address sourceToken,
        address targetToken,
        uint256 sourceAmount,
        uint256 settledAmount,
        address sourceAddress,
        address targetAddress
    );
    event Withdraw(
        address token,
        address receiver,
        uint256 amount,
        bytes32 salt,
        bytes signature
    );

    event WithdrawRouter(
        address to,
        uint256 amountIn,
        uint256 amountOut,
        address foundryToken,
        address targetToken,
        address router,
        bytes routerCalldata,
        bytes32 salt,
        bytes multiSignature
    );

    event RouterAndSelectorWhitelisted(address router, bytes4 selector);
    event RouterAndSelectorRemoved(address router, bytes selector);

    /**
     * @notice Set the weth address
     * @param _weth The weth address
     */
    function setWeth(address _weth) external onlyOwner {
        require(_weth != address(0), "weth address cannot be zero");
        weth = _weth;
    }

    /**
     * @dev Sets the fund manager contract.
     * @param _fundManager The fund manager
     */
    function setFundManager(address _fundManager) external onlyOwner {
        require(_fundManager != address(0), "Swap pool address cannot be zero");
        fundManager = _fundManager;
    }

    /**
     * @dev Sets the fund manager contract.
     * @param _cctpFundManager The fund manager
     */
    function setCCTPFundManager(address _cctpFundManager) external onlyOwner {
        require(_cctpFundManager != address(0), "Swap pool address cannot be zero");
        cctpFundManager = _cctpFundManager;
    }

    /**
     * @dev Sets the gas wallet address.
     * @param _gasWallet The wallet which pays for the funds on withdrawal
     */
    function setGasWallet(address payable _gasWallet) external onlyOwner {
        require(
            _gasWallet != address(0),
            "FR: Gas Wallet address cannot be zero"
        );
        gasWallet = _gasWallet;
    }

    /**
     * @notice Whitelists the router and selector combination
     * @param router The router address
     * @param selectors The selectors for the router
     */
    function addRouterAndSelectors(address router, bytes4[] memory selectors) external onlyOwner {
        for (uint256 i = 0; i < selectors.length; i++) {
            routerAllowList[_getKey(router, abi.encodePacked(selectors[i]))] = true;
            emit RouterAndSelectorWhitelisted(router, selectors[i]);
        }
    }

    /**
     * @notice Removes the router and selector combination from the whitelist
     * @param router The router address
     * @param selector The selector for the router
     */
    function removeRouterAndSelector(address router, bytes calldata selector) external onlyOwner {
        routerAllowList[_getKey(router, selector)] = false;
        emit RouterAndSelectorRemoved(router, selector);
    }

    /**
     * @dev Perform a same network token swap on specified router/dex
     * @param amountIn The input amount
     * @param minAmountOut The minimum amount out accounting for slippage
     * @param fromToken The token to be swapped
     * @param toToken The token to receive after the swap
     * @param targetAddress The receiver address
     * @param router The router address
     * @param routerCalldata Calldata for the router
     */
    function swapOnSameNetwork(
        uint256 amountIn,
        uint256 minAmountOut,
        address fromToken,
        address toToken,
        address targetAddress,
        address router,
        bytes memory routerCalldata
    ) external nonReentrant {
        // Validation checks
        require(fromToken != address(0), "FR: From token address cannot be zero");
        require(toToken != address(0), "FR: To token address cannot be zero");
        require(amountIn != 0, "FR: Amount in must be greater than zero");
        require(minAmountOut != 0, "FR: Amount out must be greater than zero");
        require(targetAddress != address(0), "FR: Target address cannot be zero");

        amountIn = SafeAmount.safeTransferFrom(fromToken, _msgSender(), address(this), amountIn);

        // Perform the token swap
        uint256 amountOut = _swapAndCheckSlippage(
            targetAddress,
            fromToken,
            toToken,
            amountIn,
            minAmountOut,
            router,
            routerCalldata
        );

        // Emit Swap event
        emit SwapSameNetwork(
            fromToken,
            toToken,
            amountIn,
            amountOut,
            _msgSender(),
            targetAddress
        );
    }

    /**
     * @dev Performs a swap from native currency to specified token
     * @param minAmountOut The minimum amount of tokens expected after the swap
     * @param toToken The token to receive after the swap
     * @param targetAddress The receiver address for the token
     * @param router The router address
     * @param routerCalldata Calldata for the router
     */
    function swapOnSameNetworkETH(
        uint256 minAmountOut,
        address toToken,
        address targetAddress,
        address router,
        bytes memory routerCalldata
    ) external payable {
        uint256 amountIn = msg.value;
        // Validation checks
        require(toToken != address(0), "FR: To token address cannot be zero");
        require(amountIn != 0, "FR: Amount in must be greater than zero");
        require(minAmountOut != 0, "FR: Amount out must be greater than zero");
        require(targetAddress != address(0), "FR: Target address cannot be zero");
        require(bytes(routerCalldata).length != 0, "FR: Calldata cannot be empty");

        // Deposit ETH and get WETH
        IWETH(weth).deposit{value: amountIn}();

        uint256 amountOut = _swapAndCheckSlippage(
            targetAddress,
            weth,
            toToken,
            amountIn,
            minAmountOut,
            router,
            routerCalldata
        );

        // Emit Swap event
        emit SwapSameNetwork(
            NATIVE_CURRENCY,
            toToken,
            amountIn,
            amountOut,
            _msgSender(),
            targetAddress
        );
    }

    /**
     * @dev Initiates a token swap.
     * @param token The token to be swapped.
     * @param amount The amount to be swapped.
     * @param withdrawalData Data related to the withdrawal.
     * @param cctpType Boolean indicating whether it's a CCTP swap.
     */
    function swapSigned(
        address token,
        uint256 amount,
        SwapCrossData memory sd,
        bytes32 withdrawalData,
        bool cctpType,
        FeeDistributionData memory fd
    ) external payable nonReentrant {
        // Validation checks
        require(token != address(0), "FR: Token address cannot be zero");
        require(sd.targetToken != address(0), "FR: Target token address cannot be zero");
        require(sd.targetNetwork != 0, "FR: Target network is required");
        require(sd.targetAddress != address(0), "FR: Target address cannot be zero");
        require(amount != 0, "FR: Amount must be greater than zero");
        require(withdrawalData != 0, "FR: Withdraw data cannot be empty");
        require(msg.value != 0, "FR: Gas Amount must be greater than zero");

        // Transfer tokens to FiberRouter
        amount = SafeAmount.safeTransferFrom(token, _msgSender(), address(this), amount);

        // Distribute the fees
        uint256 amountOut = _distributeFees(token, amount, fd);

        // Perform the token swap based on swapCCTP flag
        uint64 depositNonce;
        if (cctpType) {
            // Proceed with the CCTP swap logic
            SafeERC20.safeTransfer(IERC20(token), cctpFundManager, amountOut);
            depositNonce = CCTPFundManager(cctpFundManager).swapCCTP(amountOut, token, sd.targetNetwork);
        } else {
            // Proceed with the normal swap logic
            SafeERC20.safeTransfer(IERC20(token), fundManager, amountOut);
            FundManager(fundManager).swapToAddress(
                token,
                amount,
                sd.targetNetwork,
                sd.targetAddress
            );
        }

        // Transfer the gas fee to the gasWallet
        (bool success, ) = payable(gasWallet).call{value: msg.value}("");
        require(success, "FR: Gas fee transfer failed");

        emit Swap(
            token,
            sd.targetToken,
            block.chainid,
            sd.targetNetwork,
            amount,
            _msgSender(),
            sd.targetAddress,
            amountOut,
            withdrawalData,
            msg.value,
            depositNonce // Stays zero for non-CCTP swaps
        );
    }

    /**
     * @dev Do a local swap and generate a cross-chain swap
     * @param amountIn The input amount
     * @param minAmountOut The minimum amount out after the swap
     * @param fromToken The token to be swapped
     * @param foundryToken The foundry token used for the swap
     * @param router The router address
     * @param routerCalldata The calldata for the swap
     * @param withdrawalData Data related to the withdrawal
     * @param cctpType Boolean indicating whether it's a CCTP swap.
     */
    function swapSignedAndCrossRouter(
        uint256 amountIn,
        uint256 minAmountOut,
        address fromToken,
        address foundryToken,
        address router,
        bytes memory routerCalldata,
        SwapCrossData memory sd,
        bytes32 withdrawalData,
        bool cctpType,
        FeeDistributionData memory fd
    ) external payable nonReentrant {
        require(amountIn != 0, "FR: Amount in must be greater than zero");
        require(fromToken != address(0), "FR: From token address cannot be zero");
        require(foundryToken != address(0), "FR: Foundry token address cannot be zero");
        require(sd.targetToken != address(0), "FR: Cross target token address cannot be zero");
        require(minAmountOut != 0, "FR: Amount out must be greater than zero");
        require(withdrawalData != 0, "FR: withdraw data cannot be empty");
        require(msg.value != 0, "FR: Gas Amount must be greater than zero");

        uint256 _amountIn = SafeAmount.safeTransferFrom(fromToken, _msgSender(), address(this), amountIn);
        
        // Swap and receive tokens back to FiberRouter
        uint256 amountOut = _swapAndCheckSlippage(
            address(this),
            fromToken,
            foundryToken,
            _amountIn,
            minAmountOut,
            router,
            routerCalldata
        );

        amountOut = _distributeFees(foundryToken, amountOut, fd);

        uint64 depositNonce;
        if (cctpType) {
            // Transfer to CCTP FundManager and initiate CCTP swap
            SafeERC20.safeTransfer(IERC20(foundryToken), cctpFundManager, amountOut);
            depositNonce = CCTPFundManager(cctpFundManager).swapCCTP(amountOut, foundryToken, sd.targetNetwork);
        } else {
            // Transfer to FundManager and update inventory
            SafeERC20.safeTransfer(IERC20(foundryToken), fundManager, amountOut);
            FundManager(fundManager).swapToAddress(
                foundryToken,
                amountOut,
                sd.targetNetwork,
                sd.targetAddress
            );
        }

        // Transfer the gas fee to the gasWallet
        (bool success, ) = payable(gasWallet).call{value: msg.value}("");
        require(success, "FR: Gas fee transfer failed");

        emit Swap(
            fromToken,
            sd.targetToken,
            block.chainid,
            sd.targetNetwork,
            _amountIn,
            _msgSender(),
            sd.targetAddress,
            amountOut,
            withdrawalData,
            msg.value,
            depositNonce // Stays zero for non-CCTP swaps
        );    
    }

    /**
     * @dev Do a local swap with ETH as input and generate a cross-chain swap
     * @param minAmountOut The minimum amount out after the swap
     * @param foundryToken The foundry token used for the swap
     * @param gasFee The gas fee being charged on withdrawal
     * @param router The router address
     * @param routerCalldata The calldata for the swap
     * @param withdrawalData Data related to the withdrawal
     * @param cctpType Boolean indicating whether it's a CCTP swap.
     */
    function swapSignedAndCrossRouterETH(
        uint256 minAmountOut,
        address foundryToken,
        uint256 gasFee,
        address router,
        bytes memory routerCalldata,
        SwapCrossData memory sd,
        bytes32 withdrawalData,
        bool cctpType,
        FeeDistributionData memory fd
    ) external payable {
        require(msg.value - gasFee != 0, "FR: Amount in must be greater than zero"); // amountIn = msg.value - gasFee, but using directly here 
        require(gasFee != 0, "FR: Gas fee must be greater than zero");
        require(minAmountOut != 0, "FR: Amount out must be greater than zero");
        require(sd.targetToken != address(0), "FR: Cross target token address cannot be zero");
        require(foundryToken != address(0), "FR: Foundry token address cannot be zero");
        require(withdrawalData != 0, "FR: Withdraw data cannot be empty");

        // Deposit ETH (excluding gas fee) for WETH and swap
        IWETH(weth).deposit{value: msg.value - gasFee}();

        uint256 amountOut = _swapAndCheckSlippage(
            address(this),
            weth,
            foundryToken,
            msg.value - gasFee,
            minAmountOut,
            router,
            routerCalldata
        );

        amountOut = _distributeFees(foundryToken, amountOut, fd);

        uint64 depositNonce;
        if (cctpType) {
            // Transfer to CCTP FundManager and initiate CCTP swap
            SafeERC20.safeTransfer(IERC20(foundryToken), cctpFundManager, amountOut);
            depositNonce = CCTPFundManager(cctpFundManager).swapCCTP(amountOut, foundryToken, sd.targetNetwork);
        } else {
            // Transfer and update pool inventory
            SafeERC20.safeTransfer(IERC20(foundryToken), fundManager, amountOut);
            FundManager(fundManager).swapToAddress(
                foundryToken,
                amountOut,
                sd.targetNetwork,
                sd.targetAddress
            );
        }

        // Transfer the gas fee to the gasWallet
        (bool success, ) = payable(gasWallet).call{value: gasFee}("");
        require(success, "FR: Gas fee transfer failed");

        uint256 _gasFee = gasFee; // Stack too deep workaround
        emit Swap(
            weth,
            sd.targetToken,
            block.chainid,
            sd.targetNetwork,
            msg.value - _gasFee,
            _msgSender(),
            sd.targetAddress,
            amountOut,
            withdrawalData,
            _gasFee,
            depositNonce
        );    
    }

    /**
     * @dev Initiates a signed token withdrawal, exclusive to the router.
     * @notice Ensure valid parameters and router setup.
     * @param token The token to withdraw
     * @param payee Address for where to send the tokens to
     * @param amount The amount
     * @param salt The salt for unique tx 
     * @param expiry The expiration time for the signature
     * @param cctpType Type of withdrawal: true for CCTP, false for normal
     * @param multiSignature The multisig validator signature
     */
    function withdrawSigned(
        address token,
        address payee,
        uint256 amount,
        bytes32 salt,
        uint256 expiry,
        bytes memory multiSignature,
        bool cctpType
    ) public virtual nonReentrant {
        // Validate input parameters
        require(token != address(0), "FR: Token address cannot be zero");
        require(payee != address(0), "FR: Payee address cannot be zero");
        require(amount != 0, "FR: Amount must be greater than zero");
        require(salt > bytes32(0), "FR: Salt must be greater than zero bytes");

        address _pool = cctpType ? cctpFundManager : fundManager;

        amount = FundManager(_pool).withdrawSigned(
            token,
            payee,
            amount,
            salt,
            expiry,
            multiSignature
        );

        emit Withdraw(token, payee, amount, salt, multiSignature);
    }

    /**
     * @dev Initiates a signed token withdrawal with swap through router, exclusive to the router.
     * @notice Ensure valid parameters and router setup.
     * @param to The address to withdraw to
     * @param amountIn The amount to be swapped in
     * @param minAmountOut The minimum amount out after the swap
     * @param foundryToken The token used in the Foundry
     * @param targetToken The target token for the swap
     * @param router The router address
     * @param routerCalldata The calldata for the swap
     * @param salt The salt value for the signature
     * @param expiry The expiration time for the signature
     * @param cctpType Boolean indicating if swap to CCTP
     * @param multiSignature The multi-signature data
     */
    function withdrawSignedAndSwapRouter(
        address payable to,
        uint256 amountIn,
        uint256 minAmountOut,
        address foundryToken,
        address targetToken,
        address router,
        bytes memory routerCalldata,
        bytes32 salt,
        uint256 expiry,
        bytes memory multiSignature,
        bool cctpType
    ) public virtual nonReentrant {
        require(foundryToken != address(0), "Bad Token Address");
        require(targetToken != address(0), "FR: Target token address cannot be zero");
        require(amountIn != 0, "Amount in must be greater than zero");
        require(minAmountOut != 0, "Amount out minimum must be greater than zero");
        require(foundryToken != address(0), "Bad Token Address");

        address _pool = cctpType ? cctpFundManager : fundManager;
        
        amountIn = FundManager(_pool).withdrawSignedAndSwapRouter(
            to,
            amountIn,
            minAmountOut,
            foundryToken,
            targetToken,
            router,
            routerCalldata,
            salt,
            expiry,
            multiSignature
        );

        uint256 amountOut = _swapAndCheckSlippage(
            to,
            foundryToken,
            targetToken,
            amountIn,
            minAmountOut,
            router,
            routerCalldata
        );

        emit WithdrawRouter(
            to,
            amountIn,
            amountOut,
            foundryToken,
            targetToken,
            router,
            routerCalldata,
            salt,
            multiSignature
        );
    }

    /**
     * @notice Checks if the router and selector combination is whitelisted
     * @param router The router address
     * @param selector The selector for the router
     */
    function isAllowListed(address router, bytes memory selector) public view returns (bool) {
        return routerAllowList[_getKey(router, selector)];
    }

    /**
     * @notice Helper function for executing token swaps through provided router
     * @param targetAddress The recipient address to receive the swapped tokens
     * @param fromToken The address of the input token for the swap
     * @param toToken The address of the output token from the swap
     * @param amountIn The exact amount of input tokens to be swapped
     * @param minAmountOut The minimum amount of output tokens expected after the swap
     * @param router The router address
     * @param data The calldata for the swap
     */
    function _swapAndCheckSlippage(
        address targetAddress,
        address fromToken,
        address toToken,
        uint256 amountIn,
        uint256 minAmountOut,
        address router,
        bytes memory data
    ) internal returns (uint256) {
        require(isAllowListed(router, data), "FR: Router and selector not whitelisted");
        _approveAggregatorRouter(fromToken, router, amountIn);
        uint256 balanceBefore = _getBalance(toToken, targetAddress);
        _makeRouterCall(router, data);
        uint256 amountOut = _getBalance(toToken, targetAddress) - balanceBefore;

        require(amountOut >= minAmountOut, "FR: Slippage check failed");
        // TODO for failed slippage checks: On-chain settlement. Option are:
        // 1/ Receive USDC on dst chain
        // 2/ ask user about updated quote
        // 3/ get funds back on src chain
        return amountOut;
    }

    function _getBalance(address token, address account) private view returns (uint256) {
        return token == NATIVE_CURRENCY ? account.balance : IERC20(token).balanceOf(account);
    }

    function _approveAggregatorRouter(address token, address router, uint256 amount) private {
        if (IERC20(token).allowance(address(this), router) != 0) {
            IERC20(token).safeApprove(router, 0);
        }
        IERC20(token).safeApprove(router, amount);
    }   

    function _getKey(address router, bytes memory data) private pure returns (bytes32) {
        bytes32 key; // Takes the shape of 0x{4byteFuncSelector}00..00{20byteRouterAddress}
        assembly {
            key := or(
                and(mload(add(data, 0x20)), 0xffffffff00000000000000000000000000000000000000000000000000000000),
                router
            )
        }
        return key;
    }

    function _makeRouterCall(address router, bytes memory data) private {
        (bool success, bytes memory returnData) = router.call(data);
        if (!success) {
            if (returnData.length > 0) { // Bubble up the revert reason
                assembly {
                    let returnDataSize := mload(returnData)
                    revert(add(32, returnData), returnDataSize)
                }
            } else {
                revert("FR: Call to router failed");
            }
        }
    }
}
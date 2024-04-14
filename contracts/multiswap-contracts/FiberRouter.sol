// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "./FundManager.sol";
import "../common/tokenReceiveable.sol";
import "../common/SafeAmount.sol";
import "../common/IWETH.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 @author The ferrum network.
 @title This is a routing contract named as FiberRouter.
*/
contract FiberRouter is Ownable, TokenReceivable {
    using SafeERC20 for IERC20;
    address private constant NATIVE_CURRENCY = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    address public immutable weth;
    address public pool;
    address payable public gasWallet;
    mapping(bytes32 => bool) private routerAllowList;

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
        uint256 gasAmount
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

    event WithdrawWithSwap(
        address to,
        uint256 amountIn,
        uint256 amountOut,
        address foundryToken,
        address targetToken,
        address router,
        bytes routerCallData,
        bytes32 salt,
        bytes multiSignature
    );

    event NonEvmSwap(
        address sourceToken,
        string targetToken,
        uint256 sourceChainId,
        string targetChainId,
        uint256 sourceAmount,
        address sourceAddress,
        string targetAddress,
        uint256 settledAmount,
        bytes32 withdrawalData
    );

    event RouterAndSelectorWhitelisted(address router, bytes selector);
    event RouterAndSelectorRemoved(address router, bytes selector);

    constructor(address _weth) {
        require(_weth != address(0), "weth address cannot be zero");
        weth = _weth;
    }

    /**
     * @dev Sets the fund manager contract.
     * @param _pool The fund manager
     */
    function setPool(address _pool) external onlyOwner {
        require(_pool != address(0), "Swap pool address cannot be zero");
        pool = _pool;
    }

    /**
     * @dev Sets the gas wallet address.
     * @param _gasWallet The wallet which pays for the funds on withdrawal
     */
    function setGasWallet(address payable _gasWallet) external onlyOwner {
        require(
            _gasWallet != address(0),
            "Gas Wallet address cannot be zero"
        );
        gasWallet = _gasWallet;
    }

    /**
     * @notice Whitelists the router and selector combination
     * @param router The router address
     * @param selector The selector for the router
     */
    function addRouterAndSelector(address router, bytes calldata selector) external onlyOwner {
        routerAllowList[_getKey(router, selector)] = true;
        emit RouterAndSelectorWhitelisted(router, selector);
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
     * @param recipient The receiver address
     * @param router The router address
     * @param routerCallData Calldata for the router
     */
    function swapOnSameNetwork(
        uint256 amountIn,
        uint256 minAmountOut,
        address fromToken,
        address toToken,
        address recipient,
        address router,
        bytes memory routerCallData
    ) external nonReentrant {
        // Validation checks
        require(fromToken != address(0), "FR: From token address cannot be zero");
        require(toToken != address(0), "FR: To token address cannot be zero");
        require(amountIn != 0, "FR: Amount in must be greater than zero");
        require(minAmountOut != 0, "FR: Amount out must be greater than zero");
        require(recipient != address(0), "FR: Target address cannot be zero");

        amountIn = SafeAmount.safeTransferFrom(fromToken, _msgSender(), address(this), amountIn);

        // Perform the token swap
        uint256 amountOut = _swapAndCheckSlippage(
            recipient,
            fromToken,
            toToken,
            amountIn,
            minAmountOut,
            router,
            routerCallData
        );

        // Emit Swap event
        emit SwapSameNetwork(
            fromToken,
            toToken,
            amountIn,
            amountOut,
            _msgSender(),
            recipient
        );
    }

    /**
     * @dev Performs a swap from native currency to specified token
     * @param minAmountOut The minimum amount of tokens expected after the swap
     * @param toToken The token to receive after the swap
     * @param recipient The receiver address for the token
     * @param router The router address
     * @param routerCallData Calldata for the router
     */
    function swapOnSameNetworkETH(
        uint256 minAmountOut,
        address toToken,
        address recipient,
        address router,
        bytes memory routerCallData
    ) external payable {
        uint256 amountIn = msg.value;
        // Validation checks
        require(toToken != address(0), "FR: To token address cannot be zero");
        require(amountIn != 0, "FR: Amount in must be greater than zero");
        require(minAmountOut != 0, "FR: Amount out must be greater than zero");
        require(recipient != address(0), "FR: Target address cannot be zero");
        require(bytes(routerCallData).length != 0, "FR: Calldata cannot be empty");

        // Deposit ETH and get WETH
        IWETH(weth).deposit{value: amountIn}();

        uint256 amountOut = _swapAndCheckSlippage(
            recipient,
            weth,
            toToken,
            amountIn,
            minAmountOut,
            router,
            routerCallData
        );

        // Emit Swap event
        emit SwapSameNetwork(
            NATIVE_CURRENCY,
            toToken,
            amountIn,
            amountOut,
            _msgSender(),
            recipient
        );
    }

    /**
     * @dev Initiate an x-chain swap.
     * @param token The token to be swapped
     * @param amount The amount to be swapped
     * @param targetNetwork The target network for the swap
     * @param targetToken The target token for the swap
     * @param targetAddress The target address for the swap
     * @param withdrawalData Data related to the withdrawal
     */
    function swap(
        address token,
        uint256 amount,
        uint256 targetNetwork,
        address targetToken,
        address targetAddress,
        bytes32 withdrawalData
    ) external payable nonReentrant {
        // Validation checks
        require(token != address(0), "FR: Token address cannot be zero");
        require(targetToken != address(0), "FR: Target token address cannot be zero");
        require(targetNetwork != 0, "FR: targetNetwork is required");
        require(targetAddress != address(0), "FR: Target address cannot be zero");
        require(amount != 0, "FR: Amount must be greater than zero");
        require(withdrawalData != 0, "FR: withdraw data cannot be empty");
        require(msg.value != 0, "FR: Gas Amount must be greater than zero");

        // Proceed with the swap logic
        amount = SafeAmount.safeTransferFrom(token, _msgSender(), pool, amount);
        amount = FundManager(pool).swapToAddress(
            token,
            amount,
            targetNetwork,
            targetAddress
        );

        // Transfer the gas fee to the gasWallet
        payable(gasWallet).transfer(msg.value);

        // Emit Swap event
        emit Swap(
            token,
            targetToken,
            block.chainid,
            targetNetwork,
            amount,
            _msgSender(),
            targetAddress,
            amount,
            withdrawalData,
            msg.value
        );
    }

    /**
     *@dev Initiate an x-chain swap.
     *@param token The source token to be swaped
     *@param amount The source amount
     *@param targetNetwork The chain ID for the target network
     *@param targetToken The target token address
     *@param targetAddress Final destination on target
     *@param withdrawalData Data related to the withdrawal
     */
    function nonEvmSwap(
        address token,
        uint256 amount,
        string memory targetNetwork,
        string memory targetToken,
        string memory targetAddress,
        bytes32 withdrawalData
    ) external nonReentrant {
        // Validation checks
        require(token != address(0), "FR: Token address cannot be zero");
        require(amount != 0, "Amount must be greater than zero");
        require(
            bytes(targetNetwork).length != 0,
            "FR: Target network cannot be empty"
        );
        require(
            bytes(targetToken).length != 0,
            "FR: Target token cannot be empty"
        );
        require(
            bytes(targetAddress).length != 0,
            "FR: Target address cannot be empty"
        );
        require(
            withdrawalData != 0,
            "FR: withdraw data cannot be empty"
        );
        amount = SafeAmount.safeTransferFrom(token, _msgSender(), pool, amount);
        amount = FundManager(pool).nonEvmSwapToAddress(
            token,
            amount,
            targetNetwork,
            targetToken,
            targetAddress
        );
        emit NonEvmSwap(
            token,
            targetToken,
            block.chainid,
            targetNetwork,
            amount,
            _msgSender(),
            targetAddress,
            amount,
            withdrawalData
        );
    }

    /**
     * @dev Do a local swap and generate a cross-chain swap
     * @param amountIn The input amount
     * @param minAmountOut The minimum amount out after the swap
     * @param fromToken The token to be swapped
     * @param foundryToken The foundry token used for the swap
     * @param router The router address
     * @param routerCallData The calldata for the swap
     * @param crossTargetNetwork The target network for the swap
     * @param crossTargetToken The target token for the cross-chain swap
     * @param crossTargetAddress The target address for the cross-chain swap
     * @param withdrawalData Data related to the withdrawal
     */
    function swapTokensLocallyAndCross(
        uint256 amountIn,
        uint256 minAmountOut,
        address fromToken,
        address foundryToken,
        address router,
        bytes memory routerCallData,
        uint256 crossTargetNetwork,
        address crossTargetToken,
        address crossTargetAddress,
        bytes32 withdrawalData
    ) external payable nonReentrant {
        require(fromToken != address(0), "FR: From token address cannot be zero");
        require(foundryToken != address(0), "FR: Foundry token address cannot be zero");
        require(crossTargetToken != address(0), "FR: Cross target token address cannot be zero");
        require(amountIn != 0, "FR: Amount in must be greater than zero");
        require(minAmountOut != 0, "FR: Amount out must be greater than zero");
        require(withdrawalData != 0, "FR: withdraw data cannot be empty");
        require(msg.value != 0, "FR: Gas Amount must be greater than zero");

        amountIn = SafeAmount.safeTransferFrom(
            fromToken,
            _msgSender(),
            address(this),
            amountIn
        );

        uint256 amountOut = _swapAndCheckSlippage(
            pool,
            fromToken,
            foundryToken,
            amountIn,
            minAmountOut,
            router,
            routerCallData
        );

        // Update pool inventory and emit cross chain event
        FundManager(pool).swapToAddress(
            foundryToken,
            amountOut,
            crossTargetNetwork,
            crossTargetAddress
        );

        // Transfer the gas fee to the gasWallet
        payable(gasWallet).transfer(msg.value);

        emit Swap(
            fromToken,
            crossTargetToken,
            block.chainid,
            crossTargetNetwork,
            amountIn,
            _msgSender(),
            crossTargetAddress,
            amountOut,
            withdrawalData,
            msg.value
        );
    }

    /**
     * @dev Do a local swap with ETH as input and generate a cross-chain swap
     * @param minAmountOut The minimum amount out after the swap
     * @param foundryToken The foundry token used for the swap
     * @param gasFee The gas fee being charged on withdrawal
     * @param router The router address
     * @param routerCallData The calldata for the swap
     * @param crossTargetNetwork The target network for the swap
     * @param crossTargetToken The target token for the cross-chain swap
     * @param crossTargetAddress The target address for the cross-chain swap
     * @param withdrawalData Data related to the withdrawal
     */
    function swapETHLocallyAndCross(
        uint256 minAmountOut,
        address foundryToken,
        uint256 gasFee,
        address router,
        bytes memory routerCallData,
        uint256 crossTargetNetwork,
        address crossTargetToken,
        address crossTargetAddress,
        bytes32 withdrawalData
    ) external payable {
        uint256 amountIn = msg.value - gasFee;

        require(amountIn != 0, "FR: Amount in must be greater than zero");
        require(gasFee != 0, "FR: Gas fee must be greater than zero");
        require(minAmountOut != 0, "FR: Amount out must be greater than zero");
        require(crossTargetToken != address(0), "FR: Cross target token address cannot be zero");
        require(foundryToken != address(0), "FR: Foundry token address cannot be zero");
        require(withdrawalData != 0, "FR: Withdraw data cannot be empty");

        // Deposit ETH (excluding gas fee) for WETH and swap
        IWETH(weth).deposit{value: amountIn}();
        uint256 amountOut = _swapAndCheckSlippage(
            pool,
            weth,
            foundryToken,
            amountIn,
            minAmountOut,
            router,
            routerCallData
        );

        // Update pool inventory and emit cross chain event
        FundManager(pool).swapToAddress(
            foundryToken,
            amountOut,
            crossTargetNetwork,
            crossTargetAddress
        );

        // Transfer the gas fee to the gasWallet
        payable(gasWallet).transfer(gasFee);

        uint256 _gasFee = gasFee; // to avoid stack too deep error
        emit Swap(
            weth,
            crossTargetToken,
            block.chainid,
            crossTargetNetwork,
            amountIn,
            _msgSender(),
            crossTargetAddress,
            amountOut,
            withdrawalData,
            _gasFee
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
     * @param multiSignature The multisig validator signature
    */
    function withdrawSigned(
        address token,
        address payee,
        uint256 amount,
        bytes32 salt,
        uint256 expiry,
        bytes memory multiSignature
    ) public virtual nonReentrant {
        // Validation checks
        require(token != address(0), "FR: Token address cannot be zero");
        require(payee != address(0), "Payee address cannot be zero");
        require(amount != 0, "Amount must be greater than zero");
        require(salt > bytes32(0), "salt must be greater than zero bytes");
        // need to add restrictions
        amount = FundManager(pool).withdrawSigned(
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
     * @param routerCallData The calldata for the swap
     * @param salt The salt value for the signature
     * @param expiry The expiration time for the signature
     * @param multiSignature The multi-signature data
     */
    function withdrawSignedWithSwap(
        address payable to,
        uint256 amountIn,
        uint256 minAmountOut,
        address foundryToken,
        address targetToken,
        address router,
        bytes memory routerCallData,
        bytes32 salt,
        uint256 expiry,
        bytes memory multiSignature
    ) public virtual nonReentrant {
        require(foundryToken != address(0), "Bad Token Address");
        require(targetToken != address(0), "FR: Target token address cannot be zero");
        require(amountIn != 0, "Amount in must be greater than zero");
        require(minAmountOut != 0, "Amount out minimum must be greater than zero");
        require(foundryToken != address(0), "Bad Token Address");

        FundManager(pool).withdrawSignedWithSwap(
            to,
            amountIn,
            minAmountOut,
            foundryToken,
            targetToken,
            router,
            routerCallData,
            salt,
            expiry,
            multiSignature
        );

        amountIn = IERC20(foundryToken).balanceOf(address(this));
        uint256 amountOut = _swapAndCheckSlippage(
            to,
            foundryToken,
            targetToken,
            amountIn,
            minAmountOut,
            router,
            routerCallData
        );

        emit WithdrawWithSwap(
            to,
            amountIn,
            amountOut,
            foundryToken,
            targetToken,
            router,
            routerCallData,
            salt,
            multiSignature
        );
    }

    /**
     * @notice Checks if the router and selector combination is whitelisted
     * @param router The router address
     * @param selector The selector for the router
     */
    function isAllowListed(address router, bytes calldata selector) external view returns (bool) {
        return routerAllowList[_getKey(router, selector)];
    }

    /**
     * @notice Helper function for executing token swaps through provided router
     * @param recipient The recipient address to receive the swapped tokens
     * @param fromToken The address of the input token for the swap
     * @param toToken The address of the output token from the swap
     * @param amountIn The exact amount of input tokens to be swapped
     * @param minAmountOut The minimum amount of output tokens expected after the swap
     * @param router The router address
     * @param data The calldata for the swap
     */
    function _swapAndCheckSlippage(
        address recipient,
        address fromToken,
        address toToken,
        uint256 amountIn,
        uint256 minAmountOut,
        address router,
        bytes memory data
    ) internal returns (uint256) {
        require(routerAllowList[_getKey(router, data)], "FR: Router and selector not whitelisted");
        _approveRouter(fromToken, router, amountIn);
        uint256 balanceBefore = _getBalance(toToken, recipient);
        _makeRouterCall(router, data);
        uint256 amountOut = _getBalance(toToken, recipient) - balanceBefore;
        require(amountOut >= minAmountOut, "FR: Slippage check failed");
        return amountOut;
    }

    function _getBalance(address token, address account) public view returns (uint256) {
        return token == NATIVE_CURRENCY ? account.balance : IERC20(token).balanceOf(account);
    }

    function _approveRouter(address token, address router, uint256 amount) internal {
        if (IERC20(token).allowance(address(this), router) != 0) {
            IERC20(token).safeApprove(router, 0);
        }
        IERC20(token).safeApprove(router, amount);
    }

    function _getKey(address router, bytes memory data) internal pure returns (bytes32) {
        bytes32 key; // Takes the shape of 0x{4byteFuncSelector}00..00{20byteRouterAddress}
        assembly {
            key := or(
                and(mload(add(data, 0x20)), 0xffffffff00000000000000000000000000000000000000000000000000000000),
                router
            )
        }
        return key;
    }

    function _makeRouterCall(address router, bytes memory data) internal {
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

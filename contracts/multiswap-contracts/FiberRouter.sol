// SPDX-License-Identifier: MIT
 pragma solidity 0.8.2;

import "./FundManager.sol";
import "../common/tokenReceiveable.sol";
import "../common/SafeAmount.sol";
import "../common/oneInch/OneInchDecoder.sol";
import "../common/oneInch/IOneInchSwap.sol";
import "../common/IWETH.sol";
import "foundry-contracts/contracts/common/FerrumDeployer.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 @author The ferrum network.
 @title This is a routing contract named as FiberRouter.
*/
contract FiberRouter is Ownable, TokenReceivable {
    using SafeERC20 for IERC20;
    address public pool;
    address payable public gasWallet;
    address public oneInchAggregatorRouter;
    address public WETH;

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

    event Withdraw(
        address token,
        address receiver,
        uint256 amount,
        bytes32 salt,
        bytes signature
    );

    event WithdrawOneInch(
        address to,
        uint256 amountIn,
        uint256 amountOutOneInch,
        address foundryToken,
        address targetToken,
        bytes oneInchData,
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
    event UnoSwapHandled(
        address indexed swapRouter,
        address indexed to,
        address indexed fromToken,
        uint256 amountIn,
        uint256 amountOut
    );
    event UniswapV3SwapHandled(
        address indexed swapRouter,
        address indexed to,
        uint256 amountIn,
        uint256 amountOut
    );
    event SwapHandled(
        address indexed swapRouter,
        address indexed to,
        address indexed fromToken,
        uint256 amountIn,
        uint256 amountOut
    );

   /**
     * @dev Constructor that sets the WETH address, oneInchAggregator address, and the pool address.
     */
    constructor() {
        bytes memory initData = IFerrumDeployer(msg.sender).initData();
        (WETH, oneInchAggregatorRouter, pool) = abi.decode(
            initData,
            (address, address, address)
        );
        require(WETH != address(0), "WETH address cannot be the zero address");
        require(
            oneInchAggregatorRouter != address(0),
            "oneInchAggregator address cannot be the zero address"
        );
        require(pool != address(0), "Pool address cannot be the zero address");
    }

    /**
     @dev Sets the fund manager contract.
     @param _pool The fund manager
     */
    function setPool(address _pool) external onlyOwner {
        require(
            _pool != address(0),
            "Swap pool address cannot be zero"
        );
        pool = _pool;
    }

    /**
     @dev Sets the gas wallet address.
     @param _gasWallet The wallet which pays for the funds on withdrawal
     */
    function setGasWallet(address payable _gasWallet) external onlyOwner {
        require(
            _gasWallet != address(0),
            "Gas Wallet address cannot be zero"
        );
        gasWallet = _gasWallet;
    }

    /**
     @dev Sets the 1inch Aggregator Router address
     @param _newRouterAddress The new Router Address of oneInch
     */
    function setOneInchAggregatorRouter(address _newRouterAddress)
        external
        onlyOwner
    {
        require(
            _newRouterAddress != address(0),
            "Swap router address cannot be zero"
        );
        oneInchAggregatorRouter = _newRouterAddress;
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
     * @param amountOut Equivalent to amountOut on oneInch
     * @param crossTargetNetwork The target network for the swap
     * @param crossTargetToken The target token for the cross-chain swap
     * @param crossTargetAddress The target address for the cross-chain swap
     * @param oneInchData The data containing information for the 1inch swap
     * @param fromToken The token to be swapped
     * @param foundryToken The foundry token used for the swap
     * @param withdrawalData Data related to the withdrawal
     */
    function swapAndCrossOneInch(
            uint256 amountIn,
            uint256 amountOut, // amountOut on oneInch
            uint256 crossTargetNetwork,
            address crossTargetToken,
            address crossTargetAddress,
            bytes memory oneInchData,
            address fromToken,
            address foundryToken,
            bytes32 withdrawalData
        ) external payable nonReentrant {
            // Validation checks
            require(
                fromToken != address(0),
                "FR: From token address cannot be zero"
            );
            require(
                foundryToken != address(0),
                "FR: Foundry token address cannot be zero"
            );
            require(
                crossTargetToken != address(0),
                "FR: Cross target token address cannot be zero"
            );
            require(amountIn != 0, "FR: Amount in must be greater than zero");
            require(amountOut != 0, "FR: Amount out must be greater than zero");
            require(
                bytes(oneInchData).length != 0,
                "FR: 1inch data cannot be empty"
            );
            require(
                withdrawalData != 0,
                "FR: withdraw data cannot be empty"
            );
            require(msg.value != 0, "FR: Gas Amount must be greater than zero");
            amountIn = SafeAmount.safeTransferFrom(
                fromToken,
                _msgSender(),
                address(this),
                amountIn
            );
            uint256 settledAmount = _swapAndCrossOneInch(
                amountIn,
                amountOut,
                crossTargetNetwork,
                crossTargetAddress,
                oneInchData,
                fromToken,
                foundryToken
            );
            // Transfer the gas fee to the gasWallet
            payable(gasWallet).transfer(msg.value);
            // Emit Swap event
            emit Swap(
                fromToken,
                crossTargetToken,
                block.chainid,
                crossTargetNetwork,
                amountIn,
                _msgSender(),
                crossTargetAddress,
                settledAmount,
                withdrawalData,
                msg.value
            );
        }

    /**
     * @dev Swap and cross to oneInch in native currency
     * @param amountOut Equivalent to amountOut on oneInch
     * @param crossTargetNetwork The target network for the swap
     * @param crossTargetToken The target token for the cross-chain swap
     * @param crossTargetAddress The target address for the cross-chain swap
     * @param oneInchData The data containing information for the 1inch swap
     * @param foundryToken The foundry token used for the swap
     * @param withdrawalData Data related to the withdrawal
     * @param gasFee The gas fee being charged on withdrawal
     */
    function swapAndCrossOneInchETH(
        uint256 amountOut, // amountOut on oneInch
        uint256 crossTargetNetwork,
        address crossTargetToken,
        address crossTargetAddress,
        bytes memory oneInchData,
        address foundryToken,
        bytes32 withdrawalData,
        uint256 gasFee
    ) external payable {
        uint256 amountIn = msg.value - gasFee;
        // Validation checks
        require(amountIn != 0, "FR: Amount in must be greater than zero");
        require(gasFee != 0, "FR: Gas fee must be greater than zero");
        require(msg.value == amountIn + gasFee, "FR: msg.value must equal amountIn plus gasFee");
        require(amountOut != 0, "FR: Amount out must be greater than zero");
        require(crossTargetToken != address(0), "FR: Cross target token address cannot be zero");
        require(bytes(oneInchData).length != 0, "FR: 1inch data cannot be empty");
        require(foundryToken != address(0), "FR: Foundry token address cannot be zero");
        require(withdrawalData != 0, "FR: Withdraw data cannot be empty");
        require(msg.value != 0, "FR: Gas Amount must be greater than zero");
        // Deposit ETH (excluding gas fee) and get WETH
        IWETH(WETH).deposit{value: amountIn}();
        // Execute swap and cross-chain operation
        uint256 settledAmount = _swapAndCrossOneInch(
            amountIn,
            amountOut,
            crossTargetNetwork,
            crossTargetAddress,
            oneInchData,
            WETH,
            foundryToken
        );
        // Transfer the gas fee to the gasWallet
        payable(gasWallet).transfer(gasFee);
        // Emit Swap event
        emit Swap(
            WETH,
            crossTargetToken,
            block.chainid,
            crossTargetNetwork,
            amountIn,
            _msgSender(),
            crossTargetAddress,
            settledAmount,
            withdrawalData,
            gasFee
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
     * @dev Initiates a signed OneInch token withdrawal, exclusive to the router.
     * @notice Ensure valid parameters and router setup.
     * @param to The address to withdraw to
     * @param amountIn The amount to be swapped in
     * @param amountOut The expected amount out in the OneInch swap
     * @param foundryToken The token used in the Foundry
     * @param targetToken The target token for the swap
     * @param oneInchData The data containing information for the 1inch swap
     * @param salt The salt value for the signature
     * @param expiry The expiration time for the signature
     * @param multiSignature The multi-signature data
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
    ) public virtual nonReentrant {
        require(foundryToken != address(0), "Bad Token Address");
        require(
            targetToken != address(0),
            "FR: Target token address cannot be zero"
        );
        require(amountIn != 0, "Amount in must be greater than zero");
        require(amountOut != 0, "Amount out minimum must be greater than zero");
        require(foundryToken != address(0), "Bad Token Address");
        FundManager(pool).withdrawSignedOneInch(
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
        amountIn = IERC20(foundryToken).balanceOf(address(this));
        // Check if allowance is non-zero
        if (IERC20(foundryToken).allowance(address(this), oneInchAggregatorRouter) != 0) {
            // We reset it to zero
            IERC20(foundryToken).safeApprove(oneInchAggregatorRouter, 0);
        }
        // Set the allowance to the swap amount
        IERC20(foundryToken).safeApprove(oneInchAggregatorRouter, amountIn);
        uint256 amountOutOneInch = swapHelperForOneInch(
            to,
            foundryToken,
            amountIn,
            amountOut,
            oneInchData
        );
        require(amountOutOneInch != 0, "FR: Bad amount out from oneInch");
        emit WithdrawOneInch(
            to,
            amountIn,
            amountOutOneInch,
            foundryToken,
            targetToken,
            oneInchData,
            salt,
            multiSignature
        );
    }

    /**
     * @dev Helper function for executing token swaps using OneInch aggregator
     * @param to The recipient address to receive the swapped tokens
     * @param srcToken The source token to be swapped (input token)
     * @param amountIn The amount of input tokens to be swapped
     * @param amountOut The expected amount of output tokens after the swap
     * @param oneInchData The data containing information for the 1inch swap
     * @return returnAmount The amount of tokens received after the swap and transaction execution
     */
    function swapHelperForOneInch(
        address payable to,
        address srcToken,
        uint256 amountIn,
        uint256 amountOut,
        bytes memory oneInchData
    ) internal returns (uint256 returnAmount) {
        // Extract the first 4 bytes from data
        bytes4 receivedSelector;
        assembly {
            // Extract the first 4 bytes directly from the data
            // Assuming 'data' starts with the 4-byte function selector
            receivedSelector := mload(add(oneInchData, 32))
        }
        // checking the function signature accoridng to oneInchData
        if (receivedSelector == OneInchDecoder.selectorUnoswap) {
            returnAmount = handleUnoSwap(to, srcToken, amountIn, amountOut, oneInchData);
        } else if (receivedSelector == OneInchDecoder.selectorUniswapV3Swap) {
            returnAmount = handleUniswapV3Swap(to, amountIn, amountOut, oneInchData);
        } else if (receivedSelector == OneInchDecoder.selectorSwap) {
            returnAmount = handleSwap(to, srcToken, amountIn, amountOut, oneInchData);
        } else if (receivedSelector == OneInchDecoder.selectorFillOrderTo) {
            returnAmount = handleFillOrderTo(to, srcToken, amountIn, oneInchData);
        } else if (receivedSelector == OneInchDecoder.selectorFillOrderRFQTo) {
            returnAmount = handleFillOrderRFQTo(to, srcToken, amountIn, oneInchData);
        } else {
            revert("FR: incorrect oneInchData");
        }
    }

    /**
     * @dev Handles the execution of a token swap operation using UnoSwap
     * @param to The recipient address to receive the swapped tokens
     * @param fromToken The token to be swapped from (input token)
     * @param amountIn The amount of input tokens to be swapped
     * @param amountOut The expected amount of output tokens after the swap
     * @param oneInchData The data containing information for the 1inch swap
     * @return returnAmount The amount of tokens received after the swap and transaction execution
     */
    function handleUnoSwap(
        address payable to,
        address fromToken,
        uint256 amountIn,
        uint256 amountOut,
        bytes memory oneInchData
    ) internal returns (uint256 returnAmount) {
        (
            address payable recipient,
            address srcToken,
            uint256 amount,
            uint256 minReturn,
            uint256[] memory poolsOneInch
        ) = OneInchDecoder.decodeUnoswap(oneInchData);
        require(to == recipient, "FR: recipient address bad oneInch Data");
        require(fromToken == srcToken, "FR: srcToken bad oneInch Data");
        require(amountIn == amount, "FR: inputAmount bad oneInch Data");
        require(amountOut == minReturn, "FR: outAmount bad oneInch Data");
        require(oneInchData.length >= 4, "Data too short for valid call");
        returnAmount = IOneInchSwap(oneInchAggregatorRouter).unoswapTo(
            recipient,
            srcToken,
            amount,
            minReturn,
            poolsOneInch
        );
        emit UnoSwapHandled(
            oneInchAggregatorRouter,
            to,
            fromToken,
            amountIn,
            returnAmount //should return by the unoSwap
        );
    }

    /**
     * @dev Handles the execution of a token swap operation involving 1inch aggregator
     * @param to The recipient address to receive the swapped tokens
     * @param amountIn The amount of input tokens to be swapped
     * @param amountOut The expected amount of output tokens after the swap
     * @param oneInchData The data containing information for the 1inch swap
     * @return returnAmount The amount of tokens received after the swap and transaction execution
     */
    function handleUniswapV3Swap(
        address payable to,
        uint256 amountIn,
        uint256 amountOut,
        bytes memory oneInchData
    ) internal returns (uint256 returnAmount) {
        (
            address payable recipient,
            uint256 amount,
            uint256 minReturn,
            uint256[] memory poolsOneInch
        ) = OneInchDecoder.decodeUniswapV3Swap(oneInchData);
        require(to == recipient, "FR: recipient address bad oneInch Data");
        require(amountIn == amount, "FR: inputAmount bad oneInch Data");
        require(amountOut == minReturn, "FR: outAmount bad oneInch Data");
        require(oneInchData.length >= 4, "Data too short for valid call");
        returnAmount = IOneInchSwap(oneInchAggregatorRouter).uniswapV3SwapTo(
            recipient,
            amount,
            minReturn,
            poolsOneInch
        );
        emit UniswapV3SwapHandled(
            oneInchAggregatorRouter,
            to,
            amountIn,
            returnAmount //should be returned by uniswapV3SwapTo
        );
    }

    /**
     * @dev Handles the execution of a token swap operation, potentially involving 1inch aggregator
     * @param to The recipient address to receive the swapped tokens
     * @param fromToken The address of the input token for the swap
     * @param amountIn The amount of input tokens to be swapped
     * @param amountOut The expected amount of output tokens after the swap
     * @param oneInchData The data containing information for the 1inch swap
     * @return returnAmount The amount of tokens received after the swap and transaction execution
     */
    function handleSwap(
        address payable to,
        address fromToken,
        uint256 amountIn,
        uint256 amountOut,
        bytes memory oneInchData
    ) internal returns (uint256 returnAmount) {
        // Decoding oneInchData to get the required parameters
        (
            address executor,
            OneInchDecoder.SwapDescription memory desc,
            bytes memory permit,
            bytes memory swapData
        ) = OneInchDecoder.decodeSwap(oneInchData);
        // Manually create a new SwapDescription for IOneInchSwap
        IOneInchSwap.SwapDescription memory oneInchDesc = IOneInchSwap
            .SwapDescription({
                srcToken: IERC20(desc.srcToken),
                dstToken: IERC20(desc.dstToken),
                srcReceiver: desc.srcReceiver,
                dstReceiver: desc.dstReceiver,
                amount: desc.amount,
                minReturnAmount: desc.minReturnAmount,
                flags: desc.flags
            });

        // Accessing fields of the desc instance of SwapDescription struct
        require(
            to == desc.dstReceiver,
            "FR: recipient address bad oneInch Data"
        );
        require(amountIn == desc.amount, "FR: inputAmount bad oneInch Data");
        require(
            amountOut == desc.minReturnAmount,
            "FR: outAmount bad oneInch Data"
        );
        require(fromToken == desc.srcToken, "FR: srcToken bad oneInch Data");

        // Additional safety check
        require(oneInchData.length >= 4, "Data too short for valid call");

        // Performing the swap
        ( returnAmount,) = IOneInchSwap(oneInchAggregatorRouter).swap(
            executor,
            oneInchDesc,
            permit,
            swapData
        );
        emit SwapHandled(
            oneInchAggregatorRouter,
            to,
            fromToken,
            amountIn,
            returnAmount // should be returned 
        );
    }

    /**
     * @dev Handles the execution of the `fillOrderTo` operation, involving 1inch aggregator
     * @param to The recipient address to receive the swapped tokens
     * @param fromToken The address of the input token for the swap (foundryToken or takerAsset)
     * @param amountIn The amount of input tokens to be swapped
     * @param oneInchData The data containing information for the 1inch swap
     * @return returnAmount The amount of tokens received after the swap and transaction execution
     */
    function handleFillOrderTo(
        address payable to,
        address fromToken,  // foundryToken // takerAsset
        uint256 amountIn,
        bytes memory oneInchData
    ) internal returns (uint256 returnAmount) {
        // Decoding oneInchData to get the required parameters
        (
            OneInchDecoder.Order memory order_,
            bytes memory signature,
            bytes memory interaction,
            uint256 makingAmount,
            uint256 takingAmount,  // destinationAmountIn
            uint256 skipPermitAndThresholdAmount,
            address target  // receiverAddress
        ) = OneInchDecoder.decodeFillOrderTo(oneInchData);

        // Manually create a new Order for IOneInchSwap
        IOneInchSwap.Order memory oneInchOrder = IOneInchSwap
            .Order({
                salt: order_.salt,
                makerAsset: order_.makerAsset,
                takerAsset: order_.takerAsset,
                maker: order_.maker,
                receiver: order_.receiver,
                allowedSender: order_.allowedSender,
                makingAmount: order_.makingAmount,
                takingAmount: order_.takingAmount,
                offsets: order_.offsets,
                interactions: order_.interactions
            });

        // Perform additional checks and validations if needed
        require(to == target, "FR: recipient address bad oneInch Data");
        require(fromToken == order_.takerAsset, "FR: takerAsset bad oneInch Data");
        require(amountIn == takingAmount, "FR: inputAmount bad oneInch Data ");
        require(oneInchData.length >= 4, "Data too short for valid call");

        // Performing the swap
        ( returnAmount, , ) = IOneInchSwap(oneInchAggregatorRouter).fillOrderTo(
            oneInchOrder,
            signature,
            interaction,
            makingAmount,
            takingAmount,
            skipPermitAndThresholdAmount,
            target
        );

        emit SwapHandled(
            oneInchAggregatorRouter,
            to,
            fromToken,
            amountIn,
            returnAmount // should be returned 
        );
    }

    /**
     * @dev Handles the execution of the `fillOrderRFQTo` operation, involving 1inch aggregator
     * @param to The recipient address to receive the swapped tokens
     * @param fromToken The address of the input token for the swap (foundryToken or takerAsset)
     * @param amountIn The amount of input tokens to be swapped
     * @param oneInchData The data containing information for the 1inch swap
     * @return returnAmount The amount of tokens received after the swap and transaction execution
     */
    function handleFillOrderRFQTo(
        address payable to,
        address fromToken,  // foundryToken // takerAsset
        uint256 amountIn,
        bytes memory oneInchData
    ) internal returns (uint256 returnAmount) {
        // Decoding oneInchData to get the required parameters
        (
            OneInchDecoder.OrderRFQ memory order,
            bytes memory signature,
            uint256 flagsAndAmount,
            address target // receiverAddress
        ) = OneInchDecoder.decodeFillOrderRFQTo(oneInchData);

        // Manually create a new OrderRFQ for IOneInchSwap
        IOneInchSwap.OrderRFQ memory oneInchOrderRFQ = IOneInchSwap.OrderRFQ({
            info: order.info,
            makerAsset: order.makerAsset,
            takerAsset: order.takerAsset,
            maker: order.maker,
            allowedSender: order.allowedSender,
            makingAmount: order.makingAmount,
            takingAmount: order.takingAmount
        });

        // Perform additional checks and validations if needed
        require(to == target, "FR: recipient address bad oneInch Data");
        require(fromToken == order.takerAsset, "FR: takerAsset bad oneInch Data");
        require(amountIn == order.takingAmount, "FR: inputAmount bad oneInch Data ");
        require(oneInchData.length >= 4, "Data too short for valid call");

        // Performing the swap
        ( returnAmount, , ) = IOneInchSwap(oneInchAggregatorRouter).fillOrderRFQTo(
            oneInchOrderRFQ,
            signature,
            flagsAndAmount,
            target
        );

        emit SwapHandled(
            oneInchAggregatorRouter,
            to,
            fromToken,
            amountIn,
            returnAmount // should be returned 
        );
    }

    /**
     * @dev Performs a token swap and cross-network transaction using the 1inch Aggregator
     * @param amountIn The amount of input tokens to be swapped
     * @param amountOut The expected amount of output tokens after the swap on 1inch
     * @param crossTargetNetwork The network identifier for the cross-network transaction
     * @param crossTargetAddress The target address on the specified network for the cross-network transaction
     * @param oneInchData The data containing information for the 1inch swap
     * @param fromToken The address of the input token for the swap
     * @param foundryToken The address of the token used as the foundry
     * @return FMAmountOut The amount of foundry tokens received after the cross-network transaction
     */
    function _swapAndCrossOneInch(
        uint256 amountIn,
        uint256 amountOut, // amountOut on oneInch
        uint256 crossTargetNetwork,
        address crossTargetAddress,
        bytes memory oneInchData,
        address fromToken,
        address foundryToken
    ) internal returns (uint256 FMAmountOut){
        // Check if allowance is non-zero
        if (IERC20(fromToken).allowance(address(this), oneInchAggregatorRouter) != 0) {
            // Reset the allowance to zero
            IERC20(fromToken).safeApprove(oneInchAggregatorRouter, 0);
        }
        // Set the allowance to the swap amount
        IERC20(fromToken).safeApprove(oneInchAggregatorRouter, amountIn);

        uint256 oneInchAmountOut = swapHelperForOneInch(
            payable(pool),
            fromToken,
            amountIn,
            amountOut,
            oneInchData
        );
        FMAmountOut = FundManager(pool).swapToAddress(
            foundryToken,
            amountOut,
            crossTargetNetwork,
            crossTargetAddress
        );
        require(
            FMAmountOut >= oneInchAmountOut,
            "FR: Bad FM or OneInch Amount Out"
        );
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "./FundManager.sol";
import "../common/tokenReceiveable.sol";
import "../common/SafeAmount.sol";
import "../common/oneInch/oneInch.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../common/oneInch/IOneInchSwap.sol";

/**
 @author The ferrum network.
 @title This is a routing contract named as FiberRouter.
*/
contract FiberRouter is ReentrancyGuard, Ownable, TokenReceivable {
    using SafeERC20 for IERC20;
    address public pool;
    address public oneInchAggregatorRouter;

    event Swap(
        address sourceToken,
        address targetToken,
        uint256 sourceChainId,
        uint256 targetChainId,
        uint256 sourceAmount,
        address sourceAddress,
        address targetAddress,
        uint256 swapBridgeAmount
    );

    event Withdraw(
        address token,
        address receiver,
        uint256 amount,
        bytes32 salt,
        bytes signature
    );

    event WithdrawOneInch(
        address,
        uint256,
        uint256,
        address,
        address,
        bytes,
        bytes32,
        bytes
    );

    event NonEvmSwap(
        address sourceToken,
        string targetToken,
        uint256 sourceChainId,
        string targetChainId,
        uint256 sourceAmount,
        address sourceAddress,
        string targetAddress,
        uint256 swapBridgeAmount
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
     @notice Sets the fund manager contract.
     @param _pool The fund manager
     */
    function setPool(address _pool) external onlyOwner {
        require(
            _pool != address(0),
            "Swap router address cannot be zero"
        );
        pool = _pool;
    }

    // Function to set the 1inch Aggregator Router address
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

    /*
     @notice Initiate an x-chain swap.
     @param token The source token to be swaped
     @param amount The source amount
     @param targetNetwork The chain ID for the target network
     @param targetToken The target token address
     @param swapTargetTokenTo Swap the target token to a new token
     @param targetAddress Final destination on target
     @note asset is direclty transfering from user to our fundManager through fiberRouter
     */
    function swap(
        address token,
        uint256 amount,
        uint256 targetNetwork,
        address targetToken,
        address targetAddress,
        uint256 swapBridgeAmount
    ) external nonReentrant {
        // Validation checks
        require(token != address(0), "FR: Token address cannot be zero");
        require(
            targetToken != address(0),
            "FR: Target token address cannot be zero"
        );
        require(targetNetwork != 0, "FR: targetNetwork is requried");
        require(
            targetAddress != address(0),
            "FR: Target address cannot be zero"
        );
        require(amount != 0, "FR: Amount must be greater than zero");
        require(
            swapBridgeAmount != 0,
            "FR: Swap bridge amount must be greater than zero"
        );

        amount = SafeAmount.safeTransferFrom(token, _msgSender(), pool, amount);
        amount = FundManager(pool).swapToAddress(
            token,
            amount,
            targetNetwork,
            targetToken,
            targetAddress
        );
        emit Swap(
            token,
            targetToken,
            block.chainid,
            targetNetwork,
            amount,
            _msgSender(),
            targetAddress,
            swapBridgeAmount
        );
    }

    /*
     @notice Initiate an x-chain swap.
     @param token The source token to be swaped
     @param amount The source amount
     @param targetNetwork The chain ID for the target network
     @param targetToken The target token address
     @param swapTargetTokenTo Swap the target token to a new token
     @param targetAddress Final destination on target
     */
    function nonEvmSwap(
        address token,
        uint256 amount,
        string memory targetNetwork,
        string memory targetToken,
        string memory targetAddress,
        uint256 swapBridgeAmount
    ) external nonReentrant {
        // Validation checks
        require(token != address(0), "FR: Token address cannot be zero");
        require(amount != 0, "Amount must be greater than zero");
        require(
            swapBridgeAmount != 0,
            "FR: Swap bridge amount must be greater than zero"
        );
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

        amount = SafeAmount.safeTransferFrom(token, _msgSender(), pool, amount);
        amount = FundManager(pool).nonEvmSwapToAddress(
            token,
            amount,
            targetNetwork,
            targetToken,
            targetAddress
        );
        NonEvmSwap(
            token,
            targetToken,
            block.chainid,
            targetNetwork,
            amount,
            _msgSender(),
            targetAddress,
            swapBridgeAmount
        );
    }

    /*
     @notice Do a local swap and generate a cross-chain swap
     @param swapRouter The local swap router
     @param amountIn The amount in
     @param amountOut Equivalent to amountOut on oneInch
     @param path The swap path
     @param deadline The swap dealine
     @param crossTargetNetwork The target network for the swap
     @param crossSwapTargetTokenTo If different than crossTargetToken, a swap
       will also be required on the other end
     @param crossTargetAddress The target address for the swap
     */
    function swapAndCrossOneInch(
        uint256 amountIn,
        uint256 amountOut, // amountOut on oneInch
        uint256 crossTargetNetwork,
        address crossTargetToken,
        address crossTargetAddress,
        uint256 swapBridgeAmount,
        bytes memory oneInchData,
        address fromToken,
        address foundryToken
    ) external nonReentrant{
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
        amountIn = SafeAmount.safeTransferFrom(
            fromToken,
            _msgSender(),
            address(this),
            amountIn
        );
        IERC20(fromToken).safeApprove(oneInchAggregatorRouter, amountIn);
        swapHelperForOneInch(
            payable(pool),
            fromToken,
            amountIn,
            amountOut,
            oneInchData
        );
        _swapAndCrossOneInch(
            crossTargetAddress,
            amountOut,
            crossTargetNetwork,
            crossTargetToken,
            foundryToken
        );
        emit Swap(
            fromToken,
            crossTargetToken,
            block.chainid,
            crossTargetNetwork,
            amountIn,
            _msgSender(),
            crossTargetAddress,
            swapBridgeAmount
        );
    }

    /*
     @notice Do a local swap and generate a cross-chain swap
     @param swapRouter The local swap router
     @param amountIn The amount in
     @param amountOut Equivalent to amountOut on oneInch
     @param path The swap path
     @param deadline The swap dealine
     @param crossTargetNetwork The target network for the swap
     @param crossSwapTargetTokenTo If different than crossTargetToken, a swap
       will also be required on the other end
     @param crossTargetAddress The target address for the swap
     */
    function nonEvmSwapAndCrossOneInch(
        uint256 amountIn,
        uint256 amountOut, // amountOut on oneInch
        string memory crossTargetNetwork, //cudos-1
        string memory crossTargetToken, //acudos
        string memory crossTargetAddress, //acudosXYZ
        bytes memory oneInchData,
        address fromToken,
        address foundryToken,
        uint256 swapBridgeAmount
    ) external nonReentrant{
        // Validation checks
        require(fromToken != address(0), "From token address cannot be zero");
        require(
            foundryToken != address(0),
            "Foundry token address cannot be zero"
        );
        require(amountIn != 0, "Amount in must be greater than zero");
        require(
            amountOut != 0,
            "Amount cross minimum must be greater than zero"
        );
        require(bytes(oneInchData).length != 0, "1inch data cannot be empty");
        require(
            bytes(crossTargetNetwork).length != 0,
            "Cross target network cannot be empty"
        );
        require(
            bytes(crossTargetToken).length != 0,
            "Cross target token cannot be empty"
        );
        require(
            bytes(crossTargetAddress).length != 0,
            "Cross target address cannot be empty"
        );
        amountIn = SafeAmount.safeTransferFrom(
            fromToken,
            _msgSender(),
            address(this),
            amountIn
        );
        IERC20(fromToken).safeApprove(oneInchAggregatorRouter, amountIn);
        swapHelperForOneInch(
            payable(pool),
            fromToken,
            amountIn,
            amountOut,
            oneInchData
        );
        _nonEvmSwapAndCrossOneInch(
            crossTargetAddress,
            amountOut,
            crossTargetNetwork,
            crossTargetToken,
            foundryToken
        );
        NonEvmSwap(
            fromToken,
            crossTargetToken,
            block.chainid,
            crossTargetNetwork,
            amountIn,
            _msgSender(),
            crossTargetAddress,
            swapBridgeAmount
        );
    }

    /*
     @notice Withdraws funds based on a multisig
     @dev For signature swapToToken must be the same as token
     @param token The token to withdraw
     @param payee Address for where to send the tokens to
     @param amount The mount
     @param sourceChainId The source chain initiating the tx
     @param swapTxId The txId for the swap from the source chain
     @param multiSignature The multisig validator signature
     */
    function withdrawSigned(
        address token,
        address payee,
        uint256 amount,
        bytes32 salt,
        uint256 expiry,
        bytes memory multiSignature
    ) external nonReentrant {
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
        TokenReceivable.sendToken(token, payee, amount);
        emit Withdraw(token, payee, amount, salt, multiSignature);
    }

    /*
     @notice Withdraws funds and swaps to a new token
     @param to Address for where to send the tokens to
     @param swapRouter The swap router address
     @param amountIn The amount to swap
     @param sourceChainId The source chain Id. Used for signature
     @param swapTxId The source tx Id. Used for signature
     @param amountOut Same as amountOut on oneInch
     @param path The swap path
     @param deadline The swap deadline
     @param multiSignature The multisig validator signature
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
    ) external nonReentrant {
        require(foundryToken != address(0), "Bad Token Address");
        require(
            targetToken != address(0),
            "FR: Target token address cannot be zero"
        );
        require(amountIn != 0, "Amount in must be greater than zero");
        require(amountOut != 0, "Amount out minimum must be greater than zero");
        require(foundryToken != address(0), "Bad Token Address");
        amountIn = FundManager(pool).withdrawSignedOneInch(
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
        IERC20(foundryToken).approve(oneInchAggregatorRouter, amountIn);
        swapHelperForOneInch(
            to,
            foundryToken,
            amountIn,
            amountOut,
            oneInchData
        );

        emit WithdrawOneInch(
            to,
            amountIn,
            amountOut,
            foundryToken,
            targetToken,
            oneInchData,
            salt,
            multiSignature
        );
    }

    function emergencyWithdraw(
        address token,
        address payee,
        uint256 amount
    ) external onlyOwner nonReentrant returns (uint256) {
        require(token != address(0), "FR: bad token");
        require(payee != address(0), "FR: bad payee");
        require(amount != 0, "FR: bad amount");
        uint256 contractBalance = IERC20(token).balanceOf(address(this));
        require(contractBalance >= amount, "FR: insufficient Balance");
        TokenReceivable.sendToken(token, payee, amount);
        return amount;
    }

    /*
    @notice Runs a local swap and then a cross chain swap
    @param to The receiver
    @param swapRouter the swap router
    @param amountIn The amount in
    @param amountOut Equivalent to amountOut on oneInch 
    @param path The swap path
    @param deadline The swap deadline
    @param crossTargetNetwork The target chain ID
    @param crossTargetToken The target network token
    @param crossSwapTargetTokenTo The target network token after swap
    @param crossTargetAddress The receiver of tokens on the target network
    */
    function _swapAndCrossOneInch(
        address to,
        uint256 amountOut,
        uint256 crossTargetNetwork,
        address crossTargetToken, // address crossSwapTargetTokenTo // address crossTargetAddress
        address foundryToken
    ) internal {
        FundManager(pool).swapToAddress(
            foundryToken,
            amountOut,
            crossTargetNetwork,
            crossTargetToken,
            to
        );
    }

    /*
    @notice Runs a local swap and then a cross chain swap
    @param to The receiver
    @param swapRouter the swap router
    @param amountIn The amount in
    @param amountOut Equivalent to amountOut on oneInch 
    @param path The swap path
    @param deadline The swap deadline
    @param crossTargetNetwork The target chain ID
    @param crossTargetToken The target network token
    @param crossSwapTargetTokenTo The target network token after swap
    @param crossTargetAddress The receiver of tokens on the target network
    */
    function _nonEvmSwapAndCrossOneInch(
        string memory to,
        uint256 amountOut,
        string memory crossTargetNetwork,
        string memory crossTargetToken, // address crossSwapTargetTokenTo // address crossTargetAddress
        address foundryToken
    ) internal {
        FundManager(pool).nonEvmSwapToAddress(
            foundryToken,
            amountOut,
            crossTargetNetwork,
            crossTargetToken,
            to
        );
    }

    function swapHelperForOneInch(
        address payable to,
        address srcToken,
        uint256 amountIn,
        uint256 amountOut,
        bytes memory oneInchData
    ) internal {
        // Extract the first 4 bytes from data
        bytes4 receivedSelector;
        assembly {
            // Extract the first 4 bytes directly from the data
            // Assuming 'data' starts with the 4-byte function selector
            receivedSelector := mload(add(oneInchData, 32))
        }

        // checking the function signature accoridng to oneInchData
        if (receivedSelector == Decoder.selectorUnoswap) {
            handleUnoSwap(to, srcToken, amountIn, amountOut, oneInchData);
        } else if (receivedSelector == Decoder.selectorUniswapV3Swap) {
            handleUniswapV3Swap(to, amountIn, amountOut, oneInchData);
        } else if (receivedSelector == Decoder.selectorSwap) {
            handleSwap(to, srcToken, amountIn, amountOut, oneInchData);
        } else {
            revert("FR: incorrect oneInchData");
        }
    }

    function handleUnoSwap(
        address payable to,
        address fromToken,
        uint256 amountIn,
        uint256 amountOut,
        bytes memory oneInchData
    ) public {
        (
            address payable recipient,
            address srcToken,
            uint256 amount,
            uint256 minReturn,
            uint256[] memory poolsOneInch
        ) = Decoder.decodeUnoswap(oneInchData);
        require(to == recipient, "FR: recipient address bad oneInch Data");
        require(amountIn == amount, "FR: inputAmount bad oneInch Data");
        require(amountOut == minReturn, "FR: outAmount bad oneInch Data");
        require(fromToken == srcToken, "FR: srcToken bad oneInch Data");
        require(oneInchData.length >= 4, "Data too short for valid call");
        IOneInchSwap(oneInchAggregatorRouter).unoswapTo(
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
            amountOut
        );
    }

    function handleUniswapV3Swap(
        address payable to,
        uint256 amountIn,
        uint256 amountOut,
        bytes memory oneInchData
    ) public {
        (
            address payable recipient,
            uint256 amount,
            uint256 minReturn,
            uint256[] memory poolsOneInch
        ) = Decoder.decodeUniswapV3Swap(oneInchData);
        require(to == recipient, "FR: recipient address bad oneInch Data");
        require(amountIn == amount, "FR: inputAmount bad oneInch Data");
        require(amountOut == minReturn, "FR: outAmount bad oneInch Data");
        require(oneInchData.length >= 4, "Data too short for valid call");
        IOneInchSwap(oneInchAggregatorRouter).uniswapV3SwapTo(
            recipient,
            amount,
            minReturn,
            poolsOneInch
        );
        emit UniswapV3SwapHandled(
            oneInchAggregatorRouter,
            to,
            amountIn,
            amountOut
        );
    }

    function handleSwap(
        address payable to,
        address fromToken,
        uint256 amountIn,
        uint256 amountOut,
        bytes memory oneInchData
    ) public {
        // Decoding oneInchData to get the required parameters
        (
            address executor,
            Decoder.SwapDescription memory desc,
            bytes memory permit,
            bytes memory swapData
        ) = Decoder.decodeSwap(oneInchData);
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
        IOneInchSwap(oneInchAggregatorRouter).swap(
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
            amountOut
        );
    }
}

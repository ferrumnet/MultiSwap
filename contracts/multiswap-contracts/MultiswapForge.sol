// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "./ForgeFundManager.sol";
import "../common/tokenReceiveable.sol";
import "../common/SafeAmount.sol";
import "../common/oneInch/OneInchDecoder.sol";
import "../common/oneInch/IOneInchSwap.sol";
import "foundry-contracts/contracts/common/FerrumDeployer.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 @author The ferrum network.
 @title This is a gas estimation contract named as MultiswapForge.
*/
contract MultiswapForge is Ownable, TokenReceivable {
    using SafeERC20 for IERC20;
    address public pool;
    address public oneInchAggregatorRouter;

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
     * @dev Constructor that sets the oneInchAggregator address, and the pool address.
     */
    constructor() {
        bytes memory initData = IFerrumDeployer(msg.sender).initData();
        (oneInchAggregatorRouter, pool) = abi.decode(
            initData,
            (address, address)
        );
        require(
            oneInchAggregatorRouter != address(0),
            "oneInchAggregator address cannot be the zero address"
        );
        require(pool != address(0), "Pool address cannot be the zero address");
    }

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
     @notice Withdraws funds based on a multisig
     @dev For signature swapToToken must be the same as token
     @param token The token to withdraw
     @param payee Address for where to send the tokens to
     @param amount The mount
     @param sourceChainId The source chain initiating the tx
     @param swapTxId The txId for the swap from the source chain
     @param multiSignature The multisig validator signature
     */
    function estimateWithdrawSigned(
        address token,
        address payee,
        uint256 amount,
        bytes32 salt,
        uint256 expiry,
        bytes memory multiSignature
    ) external {
        // Validation checks
        require(token != address(0), "FR: Token address cannot be zero");
        require(payee != address(0), "Payee address cannot be zero");
        require(amount != 0, "Amount must be greater than zero");
        require(salt > bytes32(0), "Salt must be greater than zero bytes");

        // Create a copy of the current context
        uint256 initialGas = gasleft();

        // Simulate the withdrawal transaction with gas estimation
        ForgeFundManager(pool).withdrawSigned{gas: gasleft()}(
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
    )
        external
        returns (uint256 gasUsedWithdrawal, uint256 gasUsedSwap)
    {
        require(foundryToken != address(0), "Bad Token Address");
        require(
            targetToken != address(0),
            "FR: Target token address cannot be zero"
        );
        require(amountIn != 0, "Amount in must be greater than zero");
        require(amountOut != 0, "Amount out minimum must be greater than zero");
        require(foundryToken != address(0), "Bad Token Address");

        // Create a copy of the current context for withdrawal
        uint256 initialGasWithdrawal = gasleft();

        // Simulate the withdrawal transaction
        ForgeFundManager(pool).withdrawSignedOneInch(
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

        // Calculate the gas used during the withdrawal execution
        gasUsedWithdrawal = initialGasWithdrawal - gasleft();

        // Calculate the amount of foundryToken after withdrawal
        amountIn = IERC20(foundryToken).balanceOf(address(this));

        // Create a copy of the current context for the swap
        uint256 initialGasSwap = gasleft();

        // Approve the foundryToken for the oneInchAggregatorRouter
        IERC20(foundryToken).safeApprove(oneInchAggregatorRouter, amountIn);

        // Simulate the swap transaction
        uint256 amountOutOneInch = swapHelperForOneInch(
            to,
            foundryToken,
            amountIn,
            amountOut,
            oneInchData
        );

        // Calculate the gas used during the swap execution
        gasUsedSwap = initialGasSwap - gasleft();

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

        // Calculate the total gas used for both withdrawal and swap
        uint256 totalGasUsed = gasUsedWithdrawal + gasUsedSwap;

        // Revert to mimic the transaction but capture the gas estimation
        revert(
            string(
                abi.encodePacked(
                    "Estimation completed; total gas used: ",
                    uintToString(totalGasUsed)
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

   }

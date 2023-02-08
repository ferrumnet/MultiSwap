// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "./FundManager.sol";
import "../common/uniswap/IUniswapV2Router02.sol";
import "../common/uniswap/IWETH.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract FiberRouter is ReentrancyGuardUpgradeable, OwnableUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    address public pool;
    mapping(address => AggregatorV3Interface) public priceFeed; // map each token address to racle
    mapping(address => uint256) public swapFee;
    event Swap(
        address sourceToken,
        address targetToken,
        uint256 sourceChainId,
        uint256 targetChainId,
        uint256 sourceAmount,
        address sourceAddress,
        address targetAddress
    );

    function initialize() public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
    }

    /**
     @notice The payable receive method
     */
    receive() external payable {}

    /**
     @notice Sets the fund manager contract.
     @param _pool The fund manager
     */
    function setPool(address _pool) external onlyOwner {
        require(_pool != address(0), "Bad Pool");
        pool = _pool;
    }

    /**
     @notice Sets the oracle for foundry tokens.
     @param _token The foundry token address
     @param _oracleAddress The oracle address for price feed
     */
    function setOracle(address _token, address _oracleAddress)
        external
        onlyOwner
    {
        require(_token != address(0), "Bad token");
        require(_oracleAddress != address(0), "Bad token");
        priceFeed[_token] = AggregatorV3Interface(_oracleAddress);
    }

    /**
     @notice Sets the fee for foundry tokens.
     @param _token The foundry token address
     @param _fee The swap fee of a token
     */
    function setFee(address _token, uint256 _fee) 
        external
        onlyOwner 
    {
        require(_token != address(0), "Bad token");
        swapFee[_token] = _fee;
    }

    /**
     @notice Gets the fee for foundry tokens.
     @param _token The foundry token address
     @param _fee The swap fee of a token
     */
    function getFee(address _token) 
        public 
        view 
        returns (uint256 _fee)
    {
        return swapFee[_token];
    }

    function getFoundryTokenPrice(address _token)
        public
        view
        returns (uint256)
    {
        (
            ,
            /*uint80 roundID*/
            int256 price, /*uint startedAt*/
            ,
            ,

        ) = /*uint timeStamp*/
            /*uint80 answeredInRound*/
            priceFeed[_token].latestRoundData();
        uint8 baseDecimals = priceFeed[_token].decimals();
        return uint256(price) * 10**(18 - baseDecimals);
        // return uint(price);
    }

    function getChainId() private view returns (uint256 chainId) {
        assembly {
            chainId := chainid()
        }
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
    function swap(
        address token,
        uint256 amount,
        uint256 targetNetwork,
        address targetToken,
        address targetAddress
    ) external {
        uint256 currentChainId = getChainId();
        require(
            currentChainId != targetNetwork && token != targetToken,
            "ERROR: SAME TOKEN WITH SAME NETWORK"
        );
        IERC20Upgradeable(token).safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );
        IERC20Upgradeable(token).approve(pool, amount);
        FundManager(pool).swapToAddress(
            token,
            amount,
            targetNetwork,
            targetToken,
            targetAddress
        );
        Swap(
            token,
            targetToken,
            block.chainid,
            targetNetwork,
            amount,
            _msgSender(),
            targetAddress
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
        string memory targetAddress
    ) external {
        IERC20Upgradeable(token).safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );
        IERC20Upgradeable(token).approve(pool, amount);
        FundManager(pool).nonEvmSwapToAddress(
            token,
            amount,
            targetNetwork,
            targetToken,
            targetAddress
        );
    }

    /*
     @notice Do a local swap and generate a cross-chain swap
     @param swapRouter The local swap router
     @param amountIn The amount in
     @param amountCrossMin Equivalent to amountOutMin on uniswap
     @param path The swap path
     @param deadline The swap dealine
     @param crossTargetNetwork The target network for the swap
     @param crossSwapTargetTokenTo If different than crossTargetToken, a swap
       will also be required on the other end
     @param crossTargetAddress The target address for the swap
     */
    function swapAndCross(
        address swapRouter,
        uint256 amountIn,
        uint256 amountCrossMin, // amountOutMin on uniswap
        address[] calldata path,
        uint256 deadline,
        uint256 crossTargetNetwork,
        address crossTargetToken
    ) external nonReentrant {
        uint256 currentChainId = getChainId();
        require(
            currentChainId != crossTargetNetwork && path[0] != crossTargetToken,
            "ERROR: SAME TOKEN WITH SAME NETWORK"
        );
        amountIn = SafeAmount.safeTransferFrom(
            path[0],
            msg.sender,
            address(this),
            amountIn
        );
        IERC20Upgradeable(path[0]).approve(swapRouter, amountIn);
        _swapAndCross(
            msg.sender,
            swapRouter,
            amountIn,
            amountCrossMin,
            path,
            deadline,
            crossTargetNetwork,
            crossTargetToken
            // crossSwapTargetTokenTo
            // crossTargetAddress
        );
    }

    /*
     @notice Do a local swap and generate a cross-chain swap
     @param swapRouter The local swap router
     @param amountIn The amount in
     @param amountCrossMin Equivalent to amountOutMin on uniswap
     @param path The swap path
     @param deadline The swap dealine
     @param crossTargetNetwork The target network for the swap
     @param crossSwapTargetTokenTo If different than crossTargetToken, a swap
       will also be required on the other end
     @param crossTargetAddress The target address for the swap
     */
    function nonEvmSwapAndCross(
        address swapRouter,
        uint256 amountIn,
        uint256 amountCrossMin, // amountOutMin on uniswap
        address[] calldata path,
        uint256 deadline,
        string memory crossTargetNetwork,
        string memory crossTargetToken,
        string memory receiver
    ) external nonReentrant {
        amountIn = SafeAmount.safeTransferFrom(
            path[0],
            msg.sender,
            address(this),
            amountIn
        );
        IERC20Upgradeable(path[0]).approve(swapRouter, amountIn);
        _nonEvmSwapAndCross(
            receiver,
            swapRouter,
            amountIn,
            amountCrossMin,
            path,
            deadline,
            crossTargetNetwork,
            crossTargetToken
            // crossSwapTargetTokenTo
            // crossTargetAddress
        );
    }


    /*
     @notice Do a local swap and generate a cross-chain swap
     @param swapRouter The local swap router
     @param amountCrossMin Equivalent to amountOutMin on uniswap
     @param path The swap path
     @param deadline The swap dealine
     @param crossTargetNetwork The target network for the swap
     @param crossSwapTargetTokenTo If different than crossTargetToken, a swap
       will also be required on the other end
     @param crossTargetAddress The target address for the swap
     */
    function swapAndCrossETH(
        address swapRouter,
        uint256 amountCrossMin, // amountOutMin
        address[] calldata path,
        uint256 deadline,
        uint256 crossTargetNetwork,
        address crossTargetToken
    ) external payable {
            uint256 currentChainId = getChainId();
        require(
            currentChainId != crossTargetNetwork && path[0] != crossTargetToken,
            "ERROR: SAME TOKEN WITH SAME NETWORK"
        );
        uint256 amountIn = msg.value;
        address weth = IUniswapV2Router01(swapRouter).WETH();
        // approveIfRequired(weth, swapRouter, amountIn);
        IERC20Upgradeable(weth).approve(swapRouter, amountIn);
        IWETH(weth).deposit{value: amountIn}();
        _swapAndCross(
            msg.sender,
            swapRouter,
            amountIn,
            amountCrossMin,
            path,
            deadline,
            crossTargetNetwork,
            crossTargetToken
            // crossSwapTargetTokenTo
            // crossTargetAddress
        );
    }

    /*
    @notice Runs a local swap and then a cross chain swap
    @param to The receiver
    @param swapRouter the swap router
    @param amountIn The amount in
    @param amountCrossMin Equivalent to amountOutMin on uniswap 
    @param path The swap path
    @param deadline The swap deadline
    @param crossTargetNetwork The target chain ID
    @param crossTargetToken The target network token
    @param crossSwapTargetTokenTo The target network token after swap
    @param crossTargetAddress The receiver of tokens on the target network
    */
    function _swapAndCross(
        address to,
        address swapRouter,
        uint256 amountIn,
        uint256 amountCrossMin,
        address[] calldata path,
        uint256 deadline,
        uint256 crossTargetNetwork,
        address crossTargetToken // address crossSwapTargetTokenTo
    ) internal // address crossTargetAddress
    {
        IUniswapV2Router02(swapRouter)
            .swapExactTokensForTokensSupportingFeeOnTransferTokens(
                amountIn,
                amountCrossMin,
                path,
                address(this),
                deadline
            );
        address crossToken = path[path.length - 1];
        IERC20Upgradeable(crossToken).approve(pool, amountCrossMin);
        FundManager(pool).swapToAddress(
            crossToken,
            amountCrossMin,
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
    @param amountCrossMin Equivalent to amountOutMin on uniswap 
    @param path The swap path
    @param deadline The swap deadline
    @param crossTargetNetwork The target chain ID
    @param crossTargetToken The target network token
    @param crossSwapTargetTokenTo The target network token after swap
    @param crossTargetAddress The receiver of tokens on the target network
    */
    function _nonEvmSwapAndCross(
        string memory to,
        address swapRouter,
        uint256 amountIn,
        uint256 amountCrossMin,
        address[] calldata path,
        uint256 deadline,
        string memory crossTargetNetwork,
        string memory crossTargetToken // address crossSwapTargetTokenTo
    ) internal // address crossTargetAddress
    {
        IUniswapV2Router02(swapRouter)
            .swapExactTokensForTokensSupportingFeeOnTransferTokens(
                amountIn,
                amountCrossMin,
                path,
                address(this),
                deadline
            );
        address crossToken = path[path.length - 1];
        IERC20Upgradeable(crossToken).approve(pool, amountCrossMin);
        FundManager(pool).nonEvmSwapToAddress(
            crossToken,
            amountCrossMin,
            crossTargetNetwork,
            crossTargetToken,
            to
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
        bytes memory multiSignature
    ) external {
        FundManager(pool).withdrawSigned(
            token,
            payee,
            amount,
            salt,
            multiSignature
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
    function withdrawSignedAndSwapToFoundry(
        address bridgeFoundry,
        address targetFoundry,
        address payee,
        uint256 amount,
        bytes32 salt,
        bytes memory multiSignature
    ) external {
        uint256 bridgeFoundryPrice = getFoundryTokenPrice(bridgeFoundry);
        uint256 targetFoundryPrice = getFoundryTokenPrice(targetFoundry);
        uint256 amountOut = (amount * bridgeFoundryPrice) / targetFoundryPrice;
        FundManager(pool).withdrawSigned(
            targetFoundry,
            payee,
            amountOut,
            salt,
            multiSignature
        );
    }

    function withdraw(
        address token,
        address payee,
        uint256 amount
    ) external {
        FundManager(pool).withdraw(token, payee, amount);
    }

    function withdrawAndSwapToFoundry(
        address bridgeFoundry,
        address targetFoundry,
        address payee,
        uint256 amount
    ) external {
        uint256 bridgeFoundryPrice = getFoundryTokenPrice(bridgeFoundry);
        uint256 targetFoundryPrice = getFoundryTokenPrice(targetFoundry);
        uint256 amountOut = (amount * bridgeFoundryPrice) / targetFoundryPrice;
        FundManager(pool).withdraw(targetFoundry, payee, amountOut);
    }

    /*
     @notice Withdraws funds and swaps to a new token
     @param to Address for where to send the tokens to
     @param swapRouter The swap router address
     @param amountIn The amount to swap
     @param sourceChainId The source chain Id. Used for signature
     @param swapTxId The source tx Id. Used for signature
     @param amountOutMin Same as amountOutMin on uniswap
     @param path The swap path
     @param deadline The swap deadline
     @param multiSignature The multisig validator signature
     */
    function withdrawSignedAndSwap(
        address to,
        address swapRouter,
        uint256 amountIn,
        uint256 amountOutMin, // amountOutMin on uniswap
        address[] calldata path,
        uint256 deadline,
        bytes32 salt,
        bytes memory multiSignature
    ) external {
        require(path.length > 1, "BR: path too short");
        FundManager(pool).withdrawSigned(
            path[0],
            address(this),
            amountIn,
            salt,
            multiSignature
        );
        amountIn = IERC20Upgradeable(path[0]).balanceOf(address(this)); // Actual amount received
        IERC20Upgradeable(path[0]).approve(swapRouter, amountIn);
        IUniswapV2Router02(swapRouter)
            .swapExactTokensForTokensSupportingFeeOnTransferTokens(
                amountIn,
                amountOutMin,
                path,
                to,
                deadline
            );
    }

    /*
     @notice Withdraws funds and swaps to a new token
     @param to Address for where to send the tokens to
     @param swapRouter The swap router address
     @param amountIn The amount to swap
     @param amountOutMin Same as amountOutMin on uniswap
     @param path The swap path
     @param deadline The swap deadline
     @param multiSignature The multisig validator signature
     */
    function withdrawAndSwap(
        address to,
        address swapRouter,
        uint256 amountIn,
        uint256 amountOutMin, // amountOutMin on uniswap
        address[] calldata path,
        uint256 deadline
    ) external {
        require(path.length > 1, "BR: path too short");
        FundManager(pool).withdraw(path[0], address(this), amountIn);
        amountIn = IERC20Upgradeable(path[0]).balanceOf(address(this)); // Actual amount received
        IERC20Upgradeable(path[0]).approve(swapRouter, amountIn);
        IUniswapV2Router02(swapRouter)
            .swapExactTokensForTokensSupportingFeeOnTransferTokens(
                amountIn,
                amountOutMin,
                path,
                to,
                deadline
            );
    }

    /*
     @notice Withdraws funds and swaps to a new token
     @param to Address for where to send the tokens to
     @param swapRouter The swap router address
     @param amountIn The amount to swap
     @param sourceChainId The source chain Id. Used for signature
     @param swapTxId The source tx Id. Used for signature
     @param amountOutMin Same as amountOutMin on uniswap
     @param path The swap path
     @param deadline The swap deadline
     @param multiSignature The multisig validator signature
     */
    function withdrawSignedAndSwapETH(
        address to,
        address swapRouter,
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        uint256 deadline,
        bytes32 salt,
        bytes memory multiSignature
    ) external {
        FundManager(pool).withdrawSigned(
            path[0],
            address(this),
            amountIn,
            salt,
            multiSignature
        );
        amountIn = IERC20Upgradeable(path[0]).balanceOf(address(this)); // Actual amount received
        IUniswapV2Router02(swapRouter)
            .swapExactTokensForETHSupportingFeeOnTransferTokens(
                amountIn,
                amountOutMin,
                path,
                to,
                deadline
            );
    }

    /*
     @notice Swap token to token on the same network
     @param to Address for where to send the tokens to
     @param swapRouter The swap router address
     @param amountIn The amount to swap
     @param amountOutMin Same as amountOutMin on uniswap
     @param path The swap path
     @param deadline The swap deadline
     */
    function swapTokenForTokenSameNetwork(
        address to,
        address swapRouter,
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        uint256 deadline
    ) external {
        IERC20Upgradeable(path[0]).transferFrom(
            msg.sender,
            address(this),
            amountIn
        );
        IERC20Upgradeable(path[0]).approve(swapRouter, amountIn);
        IUniswapV2Router02(swapRouter)
            .swapExactTokensForTokensSupportingFeeOnTransferTokens(
                amountIn,
                amountOutMin,
                path,
                to,
                deadline
            );
    }

    /*
     @notice Swap token to ETH on the same network
     @param to Address for where to send the tokens to
     @param swapRouter The swap router address
     @param amountIn The amount to swap
     @param amountOutMin Same as amountOutMin on uniswap
     @param path The swap path
     @param deadline The swap deadline
     */
    function swapTokenForETHSameNetwork(
        address to,
        address swapRouter,
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        uint256 deadline
    ) external {
        IERC20Upgradeable(path[0]).transferFrom(
            msg.sender,
            address(this),
            amountIn
        );
        IERC20Upgradeable(path[0]).approve(swapRouter, amountIn);
        IUniswapV2Router02(swapRouter)
            .swapExactTokensForETHSupportingFeeOnTransferTokens(
                amountIn,
                amountOutMin,
                path,
                to,
                deadline
            );
    }

    /*
     @notice Swap ETH to token on the same network
     @param to Address for where to send the tokens to
     @param swapRouter The swap router address
     @param amountIn The amount to swap
     @param amountOutMin Same as amountOutMin on uniswap
     @param path The swap path
     @param deadline The swap deadline
     */
    function swapETHForTokenSameNetwork(
        address to,
        address swapRouter,
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        uint256 deadline
    ) external payable {
        uint256 amountIn = msg.value;
        address weth = IUniswapV2Router01(swapRouter).WETH();
        IERC20Upgradeable(weth).approve(swapRouter, amountIn);
        IWETH(weth).deposit{value: amountIn}();
        IUniswapV2Router02(swapRouter)
            .swapExactTokensForTokensSupportingFeeOnTransferTokens(
                amountIn,
                amountOutMin,
                path,
                to,
                deadline
            );
    }
}

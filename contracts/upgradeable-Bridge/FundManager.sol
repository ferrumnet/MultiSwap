// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../common/signature/SigCheckable.sol";
import "../common/WithAdmin.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract FundManager is SigCheckable, ReentrancyGuard, WithAdmin {
    using SafeERC20 for IERC20;

    address public router;
    string public constant NAME = "FUND_MANAGER";
    string public constant VERSION = "000.004";
    bytes32 constant WITHDRAW_SIGNED_METHOD =
        keccak256(
            "WithdrawSigned(address token,address payee,uint256 amount,bytes32 salt)"
        );
    bytes32 constant WITHDRAW_SIGNED_ONEINCH__METHOD =
        keccak256(
            "WithdrawSigned(address to,address swapRouter,uint256 amountIn,uint256 amountOut,address foundryToken,address targetToken,bytes oneInchData,bytes32 salt)"
        );

    event TransferBySignature(
        address signer,
        address receiver,
        address token,
        uint256 amount
    );
    event BridgeLiquidityAdded(address actor, address token, uint256 amount);
    event BridgeLiquidityRemoved(address actor, address token, uint256 amount);
    event BridgeSwap(
        address from,
        address indexed token,
        uint256 targetNetwork,
        address targetToken,
        address targetAddrdess,
        uint256 amount
    );
    event nonEvmBridgeSwap(
        address from,
        address indexed token,
        string targetNetwork,
        string targetToken,
        string targetAddrdess,
        uint256 amount
    );

    mapping(address => bool) public signers;
    mapping(address => mapping(address => uint256)) private liquidities;
    mapping(address => mapping(uint256 => address)) public allowedTargets;
    mapping(address => mapping(string => string)) public nonEvmAllowedTargets;
    mapping(address => bool) public isFoundryAsset;

    modifier onlyRouter() {
        require(msg.sender == router, "FM: Only router method");
        _;
    }

    //initialize function is constructor for upgradeable smart contract
    constructor() EIP712(NAME, VERSION) {}

    /**
     *************** Owner only operations ***************
     */

    /*
     @notice sets the router
     */
    function setRouter(address _router) external onlyOwner {
        require(_router != address(0), "FM: router requried");
        router = _router;
    }

    function addSigner(address _signer) external onlyOwner {
        require(_signer != address(0), "Bad signer");
        signers[_signer] = true;
    }

    function removeSigner(address _signer) external onlyOwner {
        require(_signer != address(0), "Bad signer");
        delete signers[_signer];
    }

    function allowTarget(
        address token,
        uint256 chainId,
        address targetToken
    ) external onlyAdmin {
        require(token != address(0), "Bad token");
        require(targetToken != address(0), "Bad targetToken");
        require(chainId != 0, "Bad chainId");
        allowedTargets[token][chainId] = targetToken;
    }

    function nonEvmAllowTarget(
        address token,
        string memory chainId,
        string memory targetToken
    ) external onlyAdmin {
        require(token != address(0), "Bad token");
        require(bytes(chainId).length > 0, "Chain ID cannot be empty");
        require(bytes(targetToken).length > 0, "Target token cannot be empty");

        nonEvmAllowedTargets[token][chainId] = targetToken;
    }

    function disallowTarget(address token, uint256 chainId) external onlyAdmin {
        require(token != address(0), "Bad token");
        require(chainId != 0, "Bad chainId");
        delete allowedTargets[token][chainId];
    }

    function nonEvmDisallowTarget(address token, string memory chainId)
        external
        onlyAdmin
    {
        require(token != address(0), "Bad token");
        require(bytes(chainId).length > 0, "Chain ID cannot be empty");
        delete nonEvmAllowedTargets[token][chainId];
    }

    function addFoundryAsset(address token) external onlyAdmin {
        require(token != address(0), "Bad token");
        isFoundryAsset[token] = true;
    }

    function removeFoundryAsset(address token) external onlyAdmin {
        require(token != address(0), "Bad token");
        isFoundryAsset[token] = false;
    }

    function swapToAddress(
        address token,
        uint256 amount,
        uint256 targetNetwork,
        address targetToken,
        address targetAddress
    ) external onlyRouter {
        require(msg.sender != address(0), "FM: bad from");
        require(token != address(0), "FM: bad token");
        require(targetNetwork != 0, "FM: targetNetwork is requried");
        require(targetToken != address(0), "FM: bad target token");
        require(
            targetAddress != address(0),
            "FM: targetAddress is required"
        );
        require(amount != 0, "FM: bad amount");
        require(
            allowedTargets[token][targetNetwork] == targetToken,
            "FM: target not allowed"
        );
        emit BridgeSwap(
            msg.sender,
            token,
            targetNetwork,
            targetToken,
            targetAddress,
            amount
        );
    }

    function nonEvmSwapToAddress(
        address token,
        uint256 amount,
        string memory targetNetwork,
        string memory targetToken,
        string memory targetAddress
    ) external onlyRouter nonReentrant {
        require(msg.sender != address(0), "FM: bad from");
        require(token != address(0), "FM: bad token");
        require(amount > 0, "FM: bad amount");
        require(bytes(targetNetwork).length > 0, "FM: empty target network");
        require(bytes(targetToken).length > 0, "FM: empty target token");
        require(bytes(targetAddress).length > 0, "FM: empty target address");
        require(
            keccak256(
                abi.encodePacked(nonEvmAllowedTargets[token][targetNetwork])
            ) == keccak256(abi.encodePacked(targetToken)),
            "FM: target not allowed"
        );
        emit nonEvmBridgeSwap(
            msg.sender,
            token,
            targetNetwork,
            targetToken,
            targetAddress,
            amount
        );
    }

    function withdrawSigned(
        address token,
        address payee,
        uint256 amount,
        bytes32 salt,
        bytes memory signature
    ) external onlyRouter nonReentrant returns (uint256) {
        require(token != address(0), "FM: bad token");
        require(payee != address(0), "FM: bad payee");
        require(salt != 0, "FM: bad salt");
        require(amount != 0, "FM: bad amount");
        bytes32 message = withdrawSignedMessage(token, payee, amount, salt);
        address _signer = signerUnique(message, signature);
        require(signers[_signer], "FM: Invalid signer");
        IERC20(token).safeTransfer(router, amount);
        emit TransferBySignature(_signer, router, token, amount);
        return amount;
    }

    function withdrawSignedOneInch(
        address to,
        address swapRouter,
        uint256 amountIn,
        uint256 amountOut, 
        address foundryToken,
        address targetToken,
        bytes memory oneInchData,
        bytes32 salt,
        bytes memory signature
    ) external onlyRouter returns (uint256) {
        require(targetToken != address(0), "FM: bad token");
        require(foundryToken != address(0), "FM: bad token");
        require(to != address(0), "FM: bad payee");
        require(salt != 0, "FM: bad salt");
        require(amountIn != 0, "FM: bad amount");
        require(amountOut != 0, "FM: bad amount");

        bytes32 message = withdrawSignedMessageOneInch(
            to,
            swapRouter,
            amountIn,
            amountOut, 
            foundryToken,
            targetToken,
            oneInchData,
            salt
        );
        address _signer = signerUnique(message, signature);
        require(signers[_signer], "FM: Invalid signer");
        IERC20(foundryToken).safeTransfer(router, amountIn);
        emit TransferBySignature(_signer, router, foundryToken, amountIn);
        return amountIn;
    }

    function emergencyWithdraw(
        address token,
        address payee,
        uint256 amount
    ) external onlyAdmin nonReentrant returns (uint256) {
        require(token != address(0), "FM: bad token");
        require(payee != address(0), "FM: bad payee");
        require(amount != 0, "FM: bad amount");
        uint256 contractBalance = IERC20(token).balanceOf(address(this));
        require(contractBalance >= amount, "insufficient Balance");
        IERC20(token).safeTransfer(payee, amount);
        return amount;
    }

    function withdrawSignedVerify(
        address token,
        address payee,
        uint256 amount,
        bytes32 salt,
        bytes calldata signature
    ) external view returns (bytes32, address) {
        bytes32 message = withdrawSignedMessage(token, payee, amount, salt);
        (bytes32 digest, address _signer) = signer(message, signature);
        return (digest, _signer);
    }

    function withdrawSignedOneInchVerify(
        address to,
        address swapRouter,
        uint256 amountIn,
        uint256 amountOut, 
        address foundryToken,
        address targetToken,
        bytes memory oneInchData,
        bytes32 salt,
        bytes calldata signature
    ) external view returns (bytes32, address) {
        bytes32 message = withdrawSignedMessageOneInch(
            to,
            swapRouter,
            amountIn,
            amountOut, 
            foundryToken,
            targetToken,
            oneInchData,
            salt
        );
        (bytes32 digest, address _signer) = signer(message, signature);
        return (digest, _signer);
    }

    function withdrawSignedMessage(
        address token,
        address payee,
        uint256 amount,
        bytes32 salt
    ) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(WITHDRAW_SIGNED_METHOD, token, payee, amount, salt)
            );
    }

    function withdrawSignedMessageOneInch(
        address to,
        address swapRouter,
        uint256 amountIn,
        uint256 amountOut, 
        address foundryToken,
        address targetToken,
        bytes memory oneInchData,
        bytes32 salt
    ) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    WITHDRAW_SIGNED_ONEINCH__METHOD,
                    to,
                    swapRouter,
                    amountIn,
                    amountOut,
                    foundryToken,
                    targetToken,
                    oneInchData,
                    salt
                )
            );
    }

    function addLiquidity(address token, uint256 amount) external nonReentrant {
        require(amount != 0, "Amount must be positive");
        require(token != address(0), "Bad token");
        require(
            isFoundryAsset[token] == true,
            "Only foundry assets can be added"
        );
        liquidities[token][msg.sender] += amount;
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit BridgeLiquidityAdded(msg.sender, token, amount);
    }

    function removeLiquidityIfPossible(address token, uint256 amount)
        external
        nonReentrant
        returns (uint256)
    {
        require(amount != 0, "Amount must be positive");
        require(token != address(0), "Bad token");
        require(
            isFoundryAsset[token] == true,
            "Only foundry assets can be removed"
        );
        uint256 liq = liquidities[token][msg.sender];
        require(liq >= amount, "Not enough liquidity");
        uint256 balance = IERC20(token).balanceOf(address(this));
        uint256 actualLiq = balance > amount ? amount : balance;

        if (actualLiq != 0) {
            liquidities[token][msg.sender] -= actualLiq;
            IERC20(token).safeTransfer(msg.sender, actualLiq);
            emit BridgeLiquidityRemoved(msg.sender, token, amount);
        }
        return actualLiq;
    }

    function liquidity(address token, address liquidityAdder)
        public
        view
        returns (uint256)
    {
        return liquidities[token][liquidityAdder];
    }
}

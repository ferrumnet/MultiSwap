// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "../common/signature/SigCheckable.sol";
import "foundry-contracts/contracts/common/FerrumDeployer.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./LiquidityManagerRole.sol";

contract FundManager is SigCheckable, LiquidityManagerRole {
    using SafeERC20 for IERC20;

    address public router;
    address public settlementManager;
    uint32 constant WEEK = 3600 * 24 * 7;
    string public constant NAME = "FUND_MANAGER";
    string public constant VERSION = "000.004";
    bytes32 constant WITHDRAW_SIGNED_METHOD =
        keccak256(
            "WithdrawSigned(address token,address payee,uint256 amount,bytes32 salt,uint256 expiry)"
        );
    bytes32 constant WITHDRAW_SIGNED_ONEINCH__METHOD =
        keccak256(
            "WithdrawSignedOneInch(address to,uint256 amountIn,uint256 amountOut,address foundryToken,address targetToken,bytes oneInchData,bytes32 salt,uint256 expiry)"
        );

    event TransferBySignature(
        address signer,
        address receiver,
        address token,
        uint256 amount
    );
    event FailedWithdrawalCancelled(
        address indexed settlementManager,
        address indexed receiver,
        address indexed token,
        uint256 amount,
        bytes32 salt
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
    mapping(bytes32=>bool) public usedSalt;

    /**
     * @dev Modifier that allows only the designated router to execute the function.
     * It checks if the sender is equal to the `router` address.
     * @notice Ensure that `router` is set before using this modifier.
     */
    modifier onlyRouter() {
        require(msg.sender == router, "FM: Only router method");
        _;
    }

    /**
     * @dev Modifier that allows only the designated settlementManager to execute the function.
     * It checks if the sender is equal to the `settlementManager` address.
     * @notice Ensure that `settlementManager` is set before using this modifier.
     */
    modifier onlySettlementManager() {
        require(msg.sender == settlementManager, "FM: Only Settlement Manager");
        _;
    }

    /**
     * @dev Contract constructor that initializes the EIP-712 domain with the specified NAME, VERSION.
     * @notice This constructor is called only once during the deployment of the contract.
     */
    constructor() EIP712(NAME, VERSION) {
        bytes memory initData = IFerrumDeployer(msg.sender).initData();

    }

    /**
     *************** Owner only operations ***************
     */

    /**
     * @dev Sets the address of settlement manager
     * @param _settlementManager The settlement manager address
     */
    function setSettlementManager(address _settlementManager) external onlyOwner {
        require(_settlementManager != address(0), "FM: Bad settlement manager");

        settlementManager = _settlementManager;
    }


    /**
     @dev sets the router
     @param _router is the FiberRouter address
     */
    function setRouter(address _router) external onlyOwner {
        require(_router != address(0), "FM: router requried");
        router = _router;
    }

    /**
     @dev sets the signer
     @param _signer is the address that generate signatures
     */
    function addSigner(address _signer) public onlyOwner {
        require(_signer != address(0), "Bad signer");
        signers[_signer] = true;
    }

    /**
     @dev removes the signer
     @param _signer is the address that generate signatures
     */
    function removeSigner(address _signer) external onlyOwner {
        require(_signer != address(0), "Bad signer");
        delete signers[_signer];
    }

    /**
     @dev sets the allowed target chain & token
     @param token is the address of foundry token on source network
     @param chainId target network's chain ID
     @param targetToken target network's foundry token address
     */
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

    /**
     @dev sets the allowed target chain & token on nonEVM chain
     @param token is the address of foundry token on source network
     @param chainId target non EVM network's chain ID
     @param targetToken target non EVM network's foundry token address
     */
    function nonEvmAllowTarget(
        address token,
        string memory chainId,
        string memory targetToken
    ) external onlyAdmin {
        require(token != address(0), "Bad token");
        require(bytes(chainId).length != 0, "Chain ID cannot be empty");
        require(bytes(targetToken).length != 0, "Target token cannot be empty");

        nonEvmAllowedTargets[token][chainId] = targetToken;
    }

    /**
     @dev removes the allowed target chain & token
     @param token is the address of foundry token on source network
     @param chainId target network's chain ID
     */
    function disallowTarget(address token, uint256 chainId) external onlyAdmin {
        require(token != address(0), "Bad token");
        require(chainId != 0, "Bad chainId");
        delete allowedTargets[token][chainId];
    }

    /**
     @dev removes the allowed target chain & token on nonEVM chain
     @param token is the address of foundry token on source network
     @param chainId target non EVM network's chain ID
     */
    function nonEvmDisallowTarget(address token, string memory chainId)
        external
        onlyAdmin
    {
        require(token != address(0), "Bad token");
        require(bytes(chainId).length != 0, "Chain ID cannot be empty");
        delete nonEvmAllowedTargets[token][chainId];
    }

    /**
     @dev sets the foundry token
     @param token is the foundry token address
     */
    function addFoundryAsset(address token) external onlyAdmin {
        require(token != address(0), "Bad token");
        isFoundryAsset[token] = true;
    }

    /**
     @dev removes the foundry token
     @param token is the foundry token address
     */
    function removeFoundryAsset(address token) external onlyAdmin {
        require(token != address(0), "Bad token");
        isFoundryAsset[token] = false;
    }

    /**
     * @dev Initiates an EVM token swap, exclusive to the router
     * @notice Ensure valid parameters and router setup
     * @param token The address of the token to be swapped
     * @param amount The amount of tokens to be swapped
     * @param targetNetwork The identifier of the target network for the swap
     * @param targetAddress The address on the target network where the swapped tokens will be sent
     * @return The actual amount of tokens swapped
    */
    function swapToAddress(
        address token,
        uint256 amount,
        uint256 targetNetwork,
        address targetAddress
    ) external onlyRouter returns(uint256) {
        address targetToken = allowedTargets[token][targetNetwork];
        require(msg.sender != address(0), "FM: bad from");
        require(token != address(0), "FM: bad token");
        require(targetNetwork != 0, "FM: targetNetwork is requried");
        require(targetToken != address(0), "FM: bad target token");
        require(targetAddress != address(0), "FM: targetAddress is required");
        require(amount != 0, "FM: bad amount");
        amount = TokenReceivable.sync(token);
        emit BridgeSwap(
            msg.sender,
            token,
            targetNetwork,
            targetToken,
            targetAddress,
            amount
        );
        return amount;
    }

    /**
     * @dev Initiates a non-EVM token swap, exclusive to the router
     * @notice Ensure valid parameters and router setup
     * @param token The address of the token to be swapped
     * @param amount The amount of tokens to be swapped
     * @param targetNetwork The identifier of the target network for the swap
     * @param targetToken The identifier of the target token on the non-EVM network
     * @param targetAddress The address on the target network where the swapped tokens will be sent
     * @return The actual amount of tokens swapped
     */
    function nonEvmSwapToAddress(
        address token,
        uint256 amount,
        string memory targetNetwork,
        string memory targetToken,
        string memory targetAddress
    ) external onlyRouter returns (uint256) {
        require(msg.sender != address(0), "FM: bad from");
        require(token != address(0), "FM: bad token");
        require(amount != 0, "FM: bad amount");
        require(bytes(targetNetwork).length != 0, "FM: empty target network");
        require(bytes(targetToken).length != 0, "FM: empty target token");
        require(bytes(targetAddress).length != 0, "FM: empty target address");
        require(
            keccak256(
                abi.encodePacked(nonEvmAllowedTargets[token][targetNetwork])
            ) == keccak256(abi.encodePacked(targetToken)),
            "FM: target not allowed"
        );
        amount = TokenReceivable.sync(token);
        emit nonEvmBridgeSwap(
            msg.sender,
            token,
            targetNetwork,
            targetToken,
            targetAddress,
            amount
        );
        return amount;
    }

    /**
     * @dev Initiates a signed token withdrawal, exclusive to the router
     * @notice Ensure valid parameters and router setup
     * @param token The token to withdraw
     * @param payee Address for where to send the tokens to
     * @param amount The amount
     * @param salt The salt for unique tx 
     * @param expiry The expiration time for the signature
     * @param signature The multisig validator signature
     * @return The actual amount of tokens withdrawn
     */
    function withdrawSigned(
        address token,
        address payee,
        uint256 amount,
        bytes32 salt,
        uint256 expiry,
        bytes memory signature
    ) external onlyRouter returns (uint256) {
        require(token != address(0), "FM: bad token");
        require(payee != address(0), "FM: bad payee");
        require(salt != 0, "FM: bad salt");
        require(amount != 0, "FM: bad amount");
        require(block.timestamp < expiry, "FM: signature timed out");
        require(expiry < block.timestamp + WEEK, "FM: expiry too far");
        bytes32 message =  keccak256(
                abi.encode(WITHDRAW_SIGNED_METHOD, token, payee, amount, salt, expiry)
            );
        address _signer = signerUnique(message, signature);
        
        require(signers[_signer], "FM: Invalid signer");
        require(!usedSalt[salt], "FM: salt already used");
        usedSalt[salt] = true;
        TokenReceivable.sendToken(token, payee, amount);
        emit TransferBySignature(_signer, payee, token, amount);
        return amount;
    }

    /**
     * @dev Initiates a signed OneInch token withdrawal, exclusive to the router
     * @notice Ensure valid parameters and router setup
     * @param to The address to withdraw to
     * @param amountIn The amount to be swapped in
     * @param amountOut The expected amount out in the OneInch swap
     * @param foundryToken The token used in the Foundry
     * @param targetToken The target token for the swap
     * @param oneInchData The data containing information for the 1inch swap
     * @param salt The salt value for the signature
     * @param expiry The expiration time for the signature
     * @param signature The multi-signature data
     * @return The actual amount of tokens withdrawn from Foundry
     */
    function withdrawSignedOneInch(
        address to,
        uint256 amountIn,
        uint256 amountOut,
        address foundryToken,
        address targetToken,
        bytes memory oneInchData,
        bytes32 salt,
        uint256 expiry,
        bytes memory signature
    ) external onlyRouter returns (uint256) {
        require(targetToken != address(0), "FM: bad token");
        require(foundryToken != address(0), "FM: bad token");
        require(to != address(0), "FM: bad payee");
        require(salt != 0, "FM: bad salt");
        require(amountIn != 0, "FM: bad amount");
        require(amountOut != 0, "FM: bad amount");
        require(block.timestamp < expiry, "FM: signature timed out");
        require(expiry < block.timestamp + WEEK, "FM: expiry too far");

        bytes32 message =  keccak256(
                abi.encode(
                    WITHDRAW_SIGNED_ONEINCH__METHOD,
                    to,
                    amountIn,
                    amountOut,
                    foundryToken,
                    targetToken,
                    oneInchData,
                    salt,
                    expiry
                )
            );
        address _signer = signerUnique(message, signature);
        require(signers[_signer], "FM: Invalid signer");
        require(!usedSalt[salt], "FM: salt already used");
        usedSalt[salt] = true;
        TokenReceivable.sendToken(foundryToken, router, amountIn);
        emit TransferBySignature(_signer, router, foundryToken, amountIn);
        return amountIn;
    }

    /**
     * @dev Verifies details of a signed token withdrawal without executing the withdrawal
     * @param token Token address for withdrawal
     * @param payee Intended recipient address
     * @param amount Amount of tokens to be withdrawn
     * @param salt Unique identifier to prevent replay attacks
     * @param expiry Expiration timestamp of the withdrawal signature
     * @param signature Cryptographic signature for verification
     * @return Digest and signer's address from the provided signature
     */
    function withdrawSignedVerify(
        address token,
        address payee,
        uint256 amount,
        bytes32 salt,
        uint256 expiry,
        bytes calldata signature
    ) external view returns (bytes32, address) {
        bytes32 message = keccak256(
                abi.encode(WITHDRAW_SIGNED_METHOD, token, payee, amount, salt, expiry)
            );
        (bytes32 digest, address _signer) = signer(message, signature);
        return (digest, _signer);
    }

    /**
     * @dev Verifies details of a signed OneInch token withdrawal without execution
     * @param to Recipient address on the target network
     * @param amountIn Tokens withdrawn from Foundry
     * @param amountOut Expected tokens on the target network
     * @param foundryToken Token withdrawn from Foundry
     * @param targetToken Token on the target network
     * @param oneInchData The data containing information for the 1inch swap
     * @param salt Unique identifier to prevent replay attacks
     * @param expiry Expiration timestamp of the withdrawal signature
     * @param signature Cryptographic signature for verification
     * @return Digest and signer's address from the provided signature
     */
    function withdrawSignedOneInchVerify(
        address to,
        uint256 amountIn,
        uint256 amountOut,
        address foundryToken,
        address targetToken,
        bytes memory oneInchData,
        bytes32 salt,
        uint256 expiry,
        bytes calldata signature
    ) external view returns (bytes32, address) {
        bytes32 message =  keccak256(
                abi.encode(
                    WITHDRAW_SIGNED_ONEINCH__METHOD,
                    to,
                    amountIn,
                    amountOut,
                    foundryToken,
                    targetToken,
                    oneInchData,
                    salt,
                    expiry
                )
            );
        (bytes32 digest, address _signer) = signer(message, signature);
        return (digest, _signer);
    }

    /**
     * @dev Cancels a signed token withdrawal
     * @param token The token to withdraw
     * @param payee Address for where to send the tokens to
     * @param amount The amount
     * @param salt The salt for unique tx 
     * @param expiry The expiration time for the signature
     * @param signature The multisig validator signature
     */
    function cancelFailedWithdrawSigned(
        address token,
        address payee,
        uint256 amount,
        bytes32 salt,
        uint256 expiry,
        bytes memory signature
    ) external onlySettlementManager {
        require(token != address(0), "FM: bad token");
        require(payee != address(0), "FM: bad payee");
        require(salt != 0, "FM: bad salt");
        require(amount != 0, "FM: bad amount");
        require(block.timestamp < expiry, "FM: signature timed out");
        require(expiry < block.timestamp + WEEK, "FM: expiry too far");
        bytes32 message =  keccak256(
                abi.encode(WITHDRAW_SIGNED_METHOD, token, payee, amount, salt, expiry)
            );
        address _signer = signerUnique(message, signature);
        
        require(signers[_signer], "FM: Invalid signer");
        require(!usedSalt[salt], "FM: salt already used");
        usedSalt[salt] = true;

        emit FailedWithdrawalCancelled(settlementManager, payee, token, amount, salt);
    }

    /**
     * @dev Cancels a signed OneInch token withdrawal
     * @notice Ensure valid parameters and router setup
     * @param to The address to withdraw to
     * @param amountIn The amount to be swapped in
     * @param amountOut The expected amount out in the OneInch swap
     * @param foundryToken The token used in the Foundry
     * @param targetToken The target token for the swap
     * @param oneInchData The data containing information for the 1inch swap
     * @param salt The salt value for the signature
     * @param expiry The expiration time for the signature
     * @param signature The multi-signature data
     */
    function cancelFailedWithdrawSignedOneInch(
        address to,
        uint256 amountIn,
        uint256 amountOut,
        address foundryToken,
        address targetToken,
        bytes memory oneInchData,
        bytes32 salt,
        uint256 expiry,
        bytes memory signature
    ) external onlySettlementManager {
        require(targetToken != address(0), "FM: bad token");
        require(foundryToken != address(0), "FM: bad token");
        require(to != address(0), "FM: bad payee");
        require(salt != 0, "FM: bad salt");
        require(amountIn != 0, "FM: bad amount");
        require(amountOut != 0, "FM: bad amount");
        require(block.timestamp < expiry, "FM: signature timed out");
        require(expiry < block.timestamp + WEEK, "FM: expiry too far");

        bytes32 message =  keccak256(
                abi.encode(
                    WITHDRAW_SIGNED_ONEINCH__METHOD,
                    to,
                    amountIn,
                    amountOut,
                    foundryToken,
                    targetToken,
                    oneInchData,
                    salt,
                    expiry
                )
            );
        address _signer = signerUnique(message, signature);
        require(signers[_signer], "FM: Invalid signer");
        require(!usedSalt[salt], "FM: salt already used");
        usedSalt[salt] = true;

        emit FailedWithdrawalCancelled(settlementManager, to, targetToken, amountIn, salt);
    }

    /**
     * @dev Adds liquidity for the specified token.
     * @param token Token address for liquidity.
     * @param amount Amount of tokens to be added.
     */
    function addLiquidity(address token, uint256 amount) external {
        require(amount != 0, "FM: Amount must be positive");
        require(token != address(0), "FM: Bad token");
        require(
            isFoundryAsset[token] == true,
            "FM: Only foundry assets can be added"
        );
        liquidities[token][msg.sender] += amount;
        amount = SafeAmount.safeTransferFrom(
            token,
            msg.sender,
            address(this),
            amount
        );
        amount = TokenReceivable.sync(token);
        emit BridgeLiquidityAdded(msg.sender, token, amount);
    }

    /**
     * @dev Removes possible liquidity for the specified token.
     * @param token Token address for liquidity removal.
     * @param amount Amount of tokens to be removed.
     * @return Actual amount of tokens removed.
     */
    function removeLiquidityIfPossible(address token, uint256 amount)
        external
        returns (uint256)
    {
        require(amount != 0, "FM: Amount must be positive");
        require(token != address(0), "FM: Bad token");
        require(
            isFoundryAsset[token] == true,
            "FM: Only foundry assets can be removed"
        );
        uint256 liq = liquidities[token][msg.sender];
        require(liq >= amount, "FM: Not enough liquidity");
        uint256 balance = IERC20(token).balanceOf(address(this));
        uint256 actualLiq = balance > amount ? amount : balance;

        if (actualLiq != 0) {
            liquidities[token][msg.sender] -= actualLiq;
            TokenReceivable.sendToken(token, msg.sender, actualLiq);
            emit BridgeLiquidityRemoved(msg.sender, token, amount);
        }
        return actualLiq;
    }

    /**
     * @dev Retrieves liquidity for the specified token and liquidity adder.
     * @param token Token address for liquidity.
     * @param liquidityAdder Address of the liquidity adder.
     * @return Current liquidity amount.
     */
    function liquidity(address token, address liquidityAdder)
        external
        view
        returns (uint256)
    {
        return liquidities[token][liquidityAdder];
    }

}

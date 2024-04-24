// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "../common/signature/SigCheckable.sol";
import "foundry-contracts/contracts/common/FerrumDeployer.sol";
import "../common/WithAdmin.sol";
import "../common/SafeAmount.sol";
import "../common/tokenReceiveable.sol";

contract CCTPFundManager is SigCheckable, WithAdmin, TokenReceivable {
    using SafeERC20 for IERC20;

    address public fiberRouter;
    uint32 constant WEEK = 3600 * 24 * 7;
    string public constant NAME = "CCTP_FUND_MANAGER";
    string public constant VERSION = "000.004";
    mapping(address => bool) public signers;
    mapping(bytes32 => bool) public usedSalt;

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

    /**
     * @dev Modifier that allows only the designated fiberRouter to execute the function.
     * It checks if the sender is equal to the `fiberRouter` address.
     * @notice Ensure that `fiberRouter` is set before using this modifier.
     */
    modifier onlyRouter() {
        require(msg.sender == fiberRouter, "FM: Only fiberRouter method");
        _;
    }

    /**
     * @dev Contract constructor that initializes the EIP-712 domain with the specified NAME, VERSION.
     * @notice This constructor is called only once during the deployment of the contract.
     */
    constructor() EIP712(NAME, VERSION) {
        // bytes memory initData = IFerrumDeployer(msg.sender).initData();
    }

    /**
     @dev sets the fiberRouter
     @param _fiberRouter is the FiberRouter address
     */
    function setRouter(address _fiberRouter) external onlyOwner {
        require(_fiberRouter != address(0), "FM: fiberRouter requried");
        fiberRouter = _fiberRouter;
    }

    /**
     @dev sets the signer
     @param _signer is the address that generate signatures
     */
    function addSigner(address _signer) external onlyOwner {
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
        // sync inventory of token
        TokenReceivable.sync(token);
        // transfer the tokens to the receiver
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
        // sync inventory of token
        TokenReceivable.sync(foundryToken);
        // transfer the tokens to the receiver
        TokenReceivable.sendToken(foundryToken, fiberRouter, amountIn);
        emit TransferBySignature(_signer, fiberRouter, foundryToken, amountIn);
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
}
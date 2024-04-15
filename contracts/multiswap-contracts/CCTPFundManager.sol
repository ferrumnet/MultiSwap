// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../common/signature/SigCheckable.sol";
import "foundry-contracts/contracts/common/FerrumDeployer.sol";
import "../common/WithAdmin.sol";
import "../common/SafeAmount.sol";
import "../common/tokenReceiveable.sol";

contract CCTPFundManager is SigCheckable, WithAdmin, TokenReceivable {
    using SafeERC20 for IERC20;

    address public fiberRouter;
    address public usdcToken;
    uint32 constant WEEK = 3600 * 24 * 7;
    string public constant NAME = "CCTP_FUND_MANAGER";
    string public constant VERSION = "000.004";
    mapping(address => bool) public signers;
    mapping(bytes32 => bool) public usedSalt;

    bytes32 constant WITHDRAW_SIGNED_METHOD =
        keccak256(
            "WithdrawSigned(address token,address payee,uint256 amount,bytes32 salt,uint256 expiry)"
        );

    event TransferBySignature(
        address signer,
        address receiver,
        address token,
        uint256 amount
    );

    /**
     * @dev Modifier that allows only the designated router to execute the function.
     * It checks if the sender is equal to the `router` address.
     * @notice Ensure that `router` is set before using this modifier.
     */
    modifier onlyRouter() {
        require(msg.sender == fiberRouter, "FM: Only router method");
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
     @dev sets the router
     @param _fiberRouter is the FiberRouter address
     */
    function setFiberRouter(address _fiberRouter) external onlyOwner {
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
        bytes32 message = keccak256(
            abi.encode(
                WITHDRAW_SIGNED_METHOD,
                token,
                payee,
                amount,
                salt,
                expiry
            )
        );
        address _signer = signerUnique(message, signature);

        require(signers[_signer], "FM: Invalid signer");
        require(!usedSalt[salt], "FM: salt already used");
        usedSalt[salt] = true;
        // need to test this if the tokens received from cctp are synced
        TokenReceivable.sync(token);
        // transfer the tokens to the receiver
        TokenReceivable.sendToken(token, payee, amount);
        emit TransferBySignature(_signer, payee, token, amount);
        return amount;
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
            abi.encode(
                WITHDRAW_SIGNED_METHOD,
                token,
                payee,
                amount,
                salt,
                expiry
            )
        );
        (bytes32 digest, address _signer) = signer(message, signature);
        return (digest, _signer);
    }
}

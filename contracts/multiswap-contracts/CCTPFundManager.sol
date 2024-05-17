// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../common/signature/SigCheckable.sol";
import "../common/WithAdmin.sol";
import "../common/SafeAmount.sol";
import "../common/cctp/ICCTPTokenMessenger.sol";

contract CCTPFundManager is SigCheckable, WithAdmin {
    using SafeERC20 for IERC20;
    address public usdcToken;
    address public cctpTokenMessenger;
    address public fiberRouter;
    uint32 constant WEEK = 3600 * 24 * 7;
    string public constant NAME = "FUND_MANAGER";
    string public constant VERSION = "000.004";
    mapping(address => bool) public signers;
    mapping(bytes32 => bool) public usedSalt;
    mapping(uint256 => TargetNetwork) public targetNetworks;

    bytes32 constant WITHDRAW_SIGNED_METHOD =
        keccak256(
            "WithdrawSigned(address token,address payee,uint256 amount,bytes32 salt,uint256 expiry)"
        );
    bytes32 constant WITHDRAW_SIGNED_WITH_SWAP_METHOD =
        keccak256(
            "withdrawSignedAndSwapRouter(address to,uint256 amountIn,uint256 minAmountOut,address foundryToken,address targetToken,address router,bytes32 salt,uint256 expiry)"
        );

    struct TargetNetwork {
        uint32 targetNetworkDomain;
        address targetCCTPFundManager;
    }

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
     * @notice Initializes the Cross-Chain Transfer Protocol (CCTP) parameters.
     * @dev This function should be called by the contract owner to set the necessary parameters for CCTP.
     * @param _cctpTokenMessenger The address of the CCTP Token Messenger contract.
     * @param _usdcToken The address of the USDC token contract.
     **/
    function initCCTP(
        address _cctpTokenMessenger,
        address _usdcToken
    ) external onlyOwner {
        require(_cctpTokenMessenger != address(0), "FR: Invalid CCTP Token Messenger address");
        require(_usdcToken != address(0), "FR: Invalid USDC Token address");

        cctpTokenMessenger = _cctpTokenMessenger;
        usdcToken = _usdcToken;
    }

    /**
     * @notice Add a new target CCTP network.
     * @param _chainID The target network chain ID
     * @param _targetNetworkDomain The domain of the target network.
     * @param _targetCCTPFundManager The fund manager address for the target network.
     */
    function setTargetCCTPNetwork(uint256 _chainID, uint32 _targetNetworkDomain, address _targetCCTPFundManager) external onlyOwner {
        require(_targetNetworkDomain != 0, "FR: Invalid Target Network Domain");
        require(_chainID != 0, "FR: Invalid Target Network ChainID");
        require(_targetCCTPFundManager != address(0), "FR: Invalid Target CCTP Fund Manager address");

        targetNetworks[_chainID] = TargetNetwork(_targetNetworkDomain, _targetCCTPFundManager);
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
        // transfer the tokens to the receiver
        IERC20(token).safeTransfer(payee, amount);
        emit TransferBySignature(_signer, payee, token, amount);
        return amount;
    }

    /**
     * @dev Initiates a signed token withdrawal with swap, exclusive to the router
     * @notice Ensure valid parameters and router setup
     * @param to The address to withdraw to
     * @param amountIn The amount to be swapped in
     * @param minAmountOut The minimum amount out from the swap
     * @param foundryToken The token used in the Foundry
     * @param targetToken The target token for the swap
     * @param router The router address
     * @param salt The salt value for the signature
     * @param expiry The expiration time for the signature
     * @param signature The multi-signature data
     * @return The actual amount of tokens withdrawn from Foundry
     */
    function withdrawSignedAndSwapRouter(
        address to,
        uint256 amountIn,
        uint256 minAmountOut,
        address foundryToken,
        address targetToken,
        address router,
        bytes32 salt,
        uint256 expiry,
        bytes memory signature
    ) external onlyRouter returns (uint256) {
        require(targetToken != address(0), "FM: bad token");
        require(foundryToken != address(0), "FM: bad token");
        require(to != address(0), "FM: bad payee");
        require(salt != 0, "FM: bad salt");
        require(amountIn != 0, "FM: bad amount");
        require(minAmountOut != 0, "FM: bad amount");
        require(block.timestamp < expiry, "FM: signature timed out");
        require(expiry < block.timestamp + WEEK, "FM: expiry too far");

        bytes32 message =  keccak256(
                abi.encode(
                    WITHDRAW_SIGNED_WITH_SWAP_METHOD,
                    to,
                    amountIn,
                    minAmountOut,
                    foundryToken,
                    targetToken,
                    router,
                    salt,
                    expiry
                )
            );
        address _signer = signerUnique(message, signature);
        require(signers[_signer], "FM: Invalid signer");
        require(!usedSalt[salt], "FM: salt already used");
        usedSalt[salt] = true;
         // transfer the tokens to the receiver
        IERC20(foundryToken).safeTransfer(msg.sender, amountIn);
        emit TransferBySignature(_signer, msg.sender, foundryToken, amountIn);
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
     * @dev Verifies details of a signed token swap withdrawal without execution
     * @param to Recipient address on the target network
     * @param amountIn Tokens withdrawn from Foundry
     * @param minAmountOut The minimum tokens on the target network
     * @param foundryToken Token withdrawn from Foundry
     * @param targetToken Token on the target network
     * @param router The router address
     * @param salt Unique identifier to prevent replay attacks
     * @param expiry Expiration timestamp of the withdrawal signature
     * @param signature Cryptographic signature for verification
     * @return Digest and signer's address from the provided signature
     */
    function withdrawSignedAndSwapRouterVerify(
        address to,
        uint256 amountIn,
        uint256 minAmountOut,
        address foundryToken,
        address targetToken,
        address router,
        bytes32 salt,
        uint256 expiry,
        bytes calldata signature
    ) external view returns (bytes32, address) {
        bytes32 message =  keccak256(
                abi.encode(
                    WITHDRAW_SIGNED_WITH_SWAP_METHOD,
                    to,
                    amountIn,
                    minAmountOut,
                    foundryToken,
                    targetToken,
                    router,
                    salt,
                    expiry
                )
            );
        (bytes32 digest, address _signer) = signer(message, signature);
        return (digest, _signer);
    }

    /**
     * @notice Initiates a Cross-Chain Transfer Protocol (CCTP) swap.
     * @dev This function handles the process of approving tokens and initiating a cross-chain token burn and deposit.
     * @param amountIn The amount of tokens to be swapped.
     * @param token The address of the token to be swapped (must be USDC).
     * @param targetNetwork The identifier of the target network for the swap.
     * @return depositNonce The nonce associated with the deposit for burn transaction.
     */
    function swapCCTP(uint256 amountIn, address token, uint256 targetNetwork) external onlyRouter returns (uint64 depositNonce){
        TargetNetwork memory target = targetNetworks[targetNetwork];
        require(target.targetNetworkDomain != 0, "FR: Target network not found");
        require(target.targetCCTPFundManager != address(0), "FR: Target CCTP FundManager address not found");
        require(token == usdcToken, "FR: Invalid token");

        require(IERC20(token).approve(cctpTokenMessenger, amountIn), "Approval failed");

        depositNonce = ICCTPTokenMessenger(cctpTokenMessenger).depositForBurn(
            amountIn,
            target.targetNetworkDomain,
            addressToBytes32(target.targetCCTPFundManager),
            usdcToken
        );
    }     

    /**
     * @notice Converts an Ethereum address to a bytes32 representation.
     * @dev This is useful for interacting with contracts or protocols that require addresses in bytes32 format.
     * @param addr The address to be converted.
     * @return The bytes32 representation of the given address.
     */
    function addressToBytes32(address addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(addr)));
    }
}
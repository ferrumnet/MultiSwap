// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../common/signature/SigCheckable.sol";
import "../common/WithAdmin.sol";
import "../common/SafeAmount.sol";
import "../common/tokenReceiveable.sol";
import "foundry-contracts/contracts/common/FerrumDeployer.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ForgeFundManager is SigCheckable, WithAdmin, TokenReceivable {
    using SafeERC20 for IERC20;

    address public forge;
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
    event BridgeLiquidityAdded(address actor, address token, uint256 amount);
    event BridgeLiquidityRemoved(address actor, address token, uint256 amount);

    mapping(address => bool) public signers;
    mapping(address => mapping(address => uint256)) private liquidities;
    mapping(address => bool) public isFoundryAsset;
    mapping(bytes32=>bool) public usedSalt;

    modifier onlyForge() {
        require(msg.sender == forge, "FM: Only forge method");
        _;
    }

    //initialize function is constructor for upgradeable smart contract
    constructor() EIP712(NAME, VERSION) {
        bytes memory initData = IFerrumDeployer(msg.sender).initData();

    }

    /**
     *************** Owner only operations ***************
     */

    /*
     @notice sets the forge
     */
    function setForge(address _forge) external onlyOwner {
        require(_forge != address(0), "FM: forge requried");
        forge = _forge;
    }

    function addSigner(address _signer) external onlyOwner {
        require(_signer != address(0), "Bad signer");
        signers[_signer] = true;
    }

    function removeSigner(address _signer) external onlyOwner {
        require(_signer != address(0), "Bad signer");
        delete signers[_signer];
    }

    function addFoundryAsset(address token) external onlyAdmin {
        require(token != address(0), "Bad token");
        isFoundryAsset[token] = true;
    }

    function removeFoundryAsset(address token) external onlyAdmin {
        require(token != address(0), "Bad token");
        isFoundryAsset[token] = false;
    }

    function withdrawSigned(
        address token,
        address payee,
        uint256 amount,
        bytes32 salt,
        uint256 expiry,
        bytes memory signature
    ) external onlyForge returns (uint256) {
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
        // Bypass signer check for the gas estimation
            // require(signers[_signer], "FM: Invalid signer");
            // require(!usedSalt[salt], "FM: salt already used");
        usedSalt[salt] = true;
        TokenReceivable.sendToken(token, payee, amount);
        emit TransferBySignature(_signer, payee, token, amount);
        return amount;
    }

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
    ) external onlyForge returns (uint256) {
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
        // Bypass signer check for the gas estimation
            // require(signers[_signer], "FM: Invalid signer");
            // require(!usedSalt[salt], "FM: salt already used");
        usedSalt[salt] = true;
        TokenReceivable.sendToken(foundryToken, forge, amountIn);
        emit TransferBySignature(_signer, forge, foundryToken, amountIn);
        return amountIn;
    }

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

    function addLiquidity(address token, uint256 amount) external {
        require(amount != 0, "Amount must be positive");
        require(token != address(0), "Bad token");
        require(
            isFoundryAsset[token] == true,
            "Only foundry assets can be added"
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

    function removeLiquidityIfPossible(address token, uint256 amount)
        external
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
            TokenReceivable.sendToken(token, msg.sender, actualLiq);
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

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FeeDistributor is EIP712, Ownable {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;
    string public constant NAME = "FEE_DISTRIBUTOR";
    string public constant VERSION = "000.001";
    uint32 constant MINUTE = 60;
    address public feeWallet;
    uint256 public platformFee; // Platform fee as a fixed amount 

    mapping(address => bool) public signers;
    mapping(bytes32 => bool) public usedSalt;

    bytes32 constant DISTRIBUTE_FEES_TYPEHASH = keccak256(
        "DistributeFees(address token,address referral,uint256 referralFee,uint256 referralDiscount,uint256 sourceAmountIn,uint256 sourceAmountOut,uint256 destinationAmountIn,uint256 destinationAmountOut,bytes32 salt,uint256 expiry)"
    );

    struct FeeDistributionData {
        address referral;
        uint256 referralFee; // Referral fee as a percentage
        uint256 referralDiscount; // Referral discount as a percentage
        uint256 sourceAmountIn;
        uint256 sourceAmountOut;
        uint256 destinationAmountIn;
        uint256 destinationAmountOut;
        bytes32 salt;
        uint256 expiry;
        bytes signature;
    }

    event FeesDistributed(
        address indexed token,
        uint256 preFeeAmount,
        uint256 afterFeeAmount,
        uint256 totalPlatformFee
    );

    constructor() EIP712(NAME, VERSION) {}

    /**
     @dev sets the signer
     @param _signer is the address that generates signatures
     */
    function addSigner(address _signer) external onlyOwner {
        require(_signer != address(0), "FD: Bad signer");
        signers[_signer] = true;
    }

    /**
     @dev removes the signer
     @param _signer is the address that generates signatures
     */
    function removeSigner(address _signer) external onlyOwner {
        delete signers[_signer];
    }

    /**
     @dev sets the fee wallet
     @param _feeWallet is the new fee wallet address
     */
    function setFeeWallet(address _feeWallet) external onlyOwner {
        require(_feeWallet != address(0), "FD: Bad fee wallet address");
        feeWallet = _feeWallet;
    }

    /**
     @dev sets the platform fee
     @param _platformFee is the new platform fee as a percentage
     */
    function setPlatformFee(uint256 _platformFee) external onlyOwner {
        require(_platformFee > 0, "FD: Platform fee must be greater than zero");
        platformFee = _platformFee;
    }

    function _distributeFees(
        address token,
        uint256 preFeeAmount,
        FeeDistributionData memory fdd
    ) internal returns (uint256) {
        require(_verify(token, fdd), "FD: Invalid signature");

        uint256 totalAmount = preFeeAmount;
        uint256 remainingAmount = totalAmount - platformFee;
        uint256 referralDiscountAmount = 0;
        uint256 referralFeeAmount = 0;
        uint256 feeWalletShare = platformFee;

        // If referral is provided, calculate the referral discount and referral fee
        if (fdd.referral != address(0)) {
            if (fdd.referralDiscount > 0) {
                referralDiscountAmount = (platformFee * fdd.referralDiscount) / 100;
                feeWalletShare -= referralDiscountAmount;
                remainingAmount += referralDiscountAmount;
            }

            if (fdd.referralFee > 0) {
                referralFeeAmount = (feeWalletShare * fdd.referralFee) / 100;
                feeWalletShare -= referralFeeAmount;
                IERC20(token).safeTransfer(fdd.referral, referralFeeAmount);
            }
        }

        // Ensure the total allocated fee does not exceed the platform fee
        require(feeWalletShare + referralFeeAmount + referralDiscountAmount <= platformFee, "FD: Total fee exceeds platform fee");

        // Transfer the remaining fee to the fee wallet
        IERC20(token).safeTransfer(feeWallet, feeWalletShare);

        emit FeesDistributed(token, preFeeAmount, remainingAmount, platformFee);

        return remainingAmount;
    }



    function _verify(
        address token,
        FeeDistributionData memory fdd
    ) private returns (bool) {
        require(block.timestamp < fdd.expiry, "FD: Signature timed out");
        require(fdd.expiry < block.timestamp + (20 * MINUTE), "FD: Expiry too far"); // 20 minutes probably too generous. Users should be submitting tx soon after quote on source chain
        require(!usedSalt[fdd.salt], "FM: Salt already used");
        usedSalt[fdd.salt] = true;

        bytes32 structHash = keccak256(
            abi.encode(
                DISTRIBUTE_FEES_TYPEHASH,
                token,
                fdd.referral,
                fdd.referralFee,
                fdd.referralDiscount,
                fdd.sourceAmountIn,
                fdd.sourceAmountOut,
                fdd.destinationAmountIn,
                fdd.destinationAmountOut,
                fdd.salt,
                fdd.expiry
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, fdd.signature);
        return signers[signer];
    }
}

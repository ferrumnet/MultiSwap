// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FeeDistributor is EIP712, Ownable {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    uint256 private constant FEE_DENOMINATOR = 10000;
    uint256 private constant MAX_FEE_BPS = 500; // 5%. Decide on a value. Probs nice for users to see we can't take more than X% in fees
    string public constant NAME = "FEE_DISTRIBUTOR";
    string public constant VERSION = "000.001";
    uint32 constant MINUTE = 60;

    mapping(address => bool) public signers;
    mapping(bytes32 => bool) public usedSalt;

    bytes32 public constant FEE_ALLOCATION_TYPEHASH = keccak256("FeeAllocation(address recipient,uint256 rateInBps)");
    bytes32 public constant DISTRIBUTE_FEES_TYPEHASH = keccak256("DistributeFees(address token,FeeAllocation[] feeAllocations,bytes32 salt,uint256 expiry)");

    struct FeeAllocation {
        address recipient;
        uint256 rateInBps;
    }

    constructor() EIP712(NAME, VERSION) {}

    /**
     @dev sets the signer
     @param _signer is the address that generate signatures
     */
    function addSigner(address _signer) external onlyOwner {
        require(_signer != address(0), "FD: Bad signer");
        signers[_signer] = true;
    }

    /**
     @dev removes the signer
     @param _signer is the address that generate signatures
     */
    function removeSigner(address _signer) external onlyOwner {
        delete signers[_signer];
    }

    function _distributeFees(
        address token,
        uint256 preFeeAmount,
        FeeAllocation[] calldata feeAllocations,
        bytes32 salt,
        uint256 expiry,
        bytes calldata signature
    ) internal returns (uint256) {
        require(
            _verify(token, feeAllocations, salt, expiry, signature),
            "FD: Invalid signature"
        );

        uint256 totalBps;
        uint256 totalFees;
        for (uint256 i = 0; i < feeAllocations.length; i++) {
            uint256 amount = (preFeeAmount * feeAllocations[i].rateInBps) / FEE_DENOMINATOR;
            IERC20(token).safeTransferFrom(address(this), feeAllocations[i].recipient, amount);
            totalBps += feeAllocations[i].rateInBps;
            totalFees += amount;
        }
        require(totalBps <= MAX_FEE_BPS, "FD: exceeds MAX_FEE_BPS");
        return preFeeAmount - totalFees;
    }

    function _verify(
        address token,
        FeeAllocation[] calldata feeAllocations,
        bytes32 salt,
        uint256 expiry,
        bytes calldata signature
    ) private returns (bool) {
        require(block.timestamp < expiry, "FD: signature timed out");
        require(expiry < block.timestamp + (30 * MINUTE) , "FD: expiry too far"); // 30 minutes probably too generous. Users should be submitting tx soon after quote on source chain
        require(!usedSalt[salt], "FM: salt already used");
        usedSalt[salt] = true;

        bytes32 structHash = keccak256(
            abi.encode(
                DISTRIBUTE_FEES_TYPEHASH,
                token,
                keccak256(_encodeFeeAllocations(feeAllocations)),
                salt,
                expiry
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, signature);
        return signers[signer];
    }

    function _encodeFeeAllocations(FeeAllocation[] calldata feeAllocations) private pure returns (bytes memory) {
        bytes32[] memory encodedFeeAllocations = new bytes32[](feeAllocations.length);
        for (uint256 i = 0; i < feeAllocations.length; i++) {
            encodedFeeAllocations[i] = keccak256(abi.encode(FEE_ALLOCATION_TYPEHASH, feeAllocations[i].recipient, feeAllocations[i].rateInBps));
        }
        return abi.encodePacked(encodedFeeAllocations);
    }
}

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

    mapping(address => bool) public signers;
    mapping(bytes32 => bool) public usedSalt;

    bytes32 public constant DISTRIBUTE_FEES_TYPEHASH = keccak256(
        "DistributeFees(address token,address recipient,uint16 platformFee,uint256 sourceAmountIn,uint256 sourceAmountOut,bytes32 salt,uint256 expiry,bytes signature)"
    );

    struct FeeDistributionData {
        address recipient;
        uint16 platformFee;
        bytes32 salt;
        uint256 expiry;
        bytes signature;
    }

    event FeesDistributed(
        address indexed token,
        uint256 preFeeAmount,
        uint256 afterFeeAmount,
        uint256 totalFee
    );

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
        FeeDistributionData memory fdd
    ) internal returns (uint256) {
        require(_verify(token, fdd), "FD: Invalid signature");
        // Transfer the token fee to the recipient
        SafeERC20.safeTransfer(IERC20(token), fdd.recipient, fdd.platformFee);
        uint256 postFeeAmount = preFeeAmount - fdd.platformFee;
        // Emit event
        emit FeesDistributed(token, preFeeAmount, postFeeAmount, fdd.platformFee);
        return postFeeAmount;
    }

    function _verify(
        address token,
        FeeDistributionData memory fdd
    ) private returns (bool) {
        require(block.timestamp < fdd.expiry, "FD: signature timed out");
        require(fdd.expiry < block.timestamp + (20 * MINUTE), "FD: expiry too far"); // 20 minutes probably too generous. Users should be submitting tx soon after quote on source chain
        require(!usedSalt[fdd.salt], "FM: salt already used");
        usedSalt[fdd.salt] = true;

        bytes32 structHash = keccak256(
            abi.encode(
                DISTRIBUTE_FEES_TYPEHASH,
                token,
                fdd.recipient,
                fdd.platformFee,
                fdd.salt,
                fdd.expiry,
                fdd.signature
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, fdd.signature);
        return signers[signer];
    }
}

// SPDX-License-Identifier: MIT
 pragma solidity 0.8.2;
import "../common/cctp/ITokenMessenger.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../common/SafeAmount.sol";

contract cctpRouter {
    using SafeERC20 for IERC20;
    address public usdcToken;

    // Addresses of CCTP contracts
    address public cctpTokenMessenger;

    // Target network information
    address public targetCCTPFundManager;

    event InitiateCCT(
        address indexed burnToken,
        uint256 sourceChainId,
        uint256 targetChainId,
        address sourceAddress,
        address targetAddress,
        uint256 amount,
        uint64 depositNonce
    );

    constructor() {
    }

    // Initialise CCTP to set CCTP contract addresses and target network information
    function init(
        address _cctpTokenMessenger,
        address _usdcToken,
        address _targetCCTPFundManager
    ) public {
            cctpTokenMessenger = _cctpTokenMessenger;
            usdcToken = _usdcToken;
            targetCCTPFundManager = _targetCCTPFundManager;
    }

  // Initiate a Circle Cross-Chain Transfer
    function cctpSwap(
        uint256 amount,
        uint32 targetNetworkDomain 
    ) public {
        // Proceed with the swap logic
        amount = SafeAmount.safeTransferFrom(usdcToken, msg.sender, address(this), amount);
        // Approve the CCTP contracts to spend USDC
        require(IERC20(usdcToken).approve(cctpTokenMessenger, amount), "Approval failed");

        // Deposit approved USDC by burning and sending cross-chain message
        uint64 depositNonce = ICCTPTokenMessenger(cctpTokenMessenger).depositForBurn(
            amount,  // amount to be burned on source / minted on target
            targetNetworkDomain, // TargetNetwork's domain (you may need to replace with the correct domain)
            bytes32(uint256(uint160(targetCCTPFundManager))),  // receiver address where the target tokens are minted
            usdcToken
        );

        // Emit InitiateCCT event
        emit InitiateCCT(
            usdcToken,
            block.chainid,
            targetNetworkDomain,
            msg.sender,
            targetCCTPFundManager,
            amount,
            depositNonce
        );
    }
}

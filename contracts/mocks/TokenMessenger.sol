// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Token.sol";


// Very simplified mock of Circle's CCTP TokenMessenger contract.
// Cross chain comms / attestations is not implemented, and simply moves the tokens to specified
// mintRecipient.
// This would be the equivalent of:
// 1/ burn on the source chain from FiberRouter contract (after user funds have been taken)
// 2/ an off-chain call to Circle's attestation service which would return a response
// 3/ a mint on the destination chain to target network's CCTPFundManager contract. Done by backend

contract TokenMessenger {
    function depositForBurn(
        uint256 amount,
        uint32 destinationDomain,
        bytes32 mintRecipient,
        address burnToken
    ) external returns (uint64 _nonce) {
        Token(burnToken).transferFrom(msg.sender, address(uint160(uint256(mintRecipient))), amount);
        return 1;
    }
}

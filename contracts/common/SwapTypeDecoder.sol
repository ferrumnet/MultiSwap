// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;


library SwapTypeDecoder {
    function isCctp() public pure returns (bool cctp) {
        assembly {
            cctp := shr(252, calldataload(0x04))
        }
    }

    function multiTokenType() public pure returns (uint256 tokenType) {
        assembly {
            tokenType := and(shr(248, calldataload(0x04)), 0x0f)
        }
    }

    function chainIdString() public pure returns (string memory) {
        bytes32 result;
        assembly {
            result := and(shr(128, calldataload(0x04)), 0x00ffffffffffffffffffffffffffffff)
        }
        return string(abi.encodePacked(result));
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library ChainIDLookup {
    function getChainID(string memory chainName) internal pure returns (uint256) {
        assembly {
            let key := mload(add(chainName, 32))

            switch key
            case 0x6f7074696d69736d000000000000000000000000000000000000000000000000 { // optimism
                mstore(0x0, 10)
            }
            case 0x506f6c79676f6e00000000000000000000000000000000000000000000000000 {  // Polygon
                mstore(0x0, 137)
            }
            case 0x6d61696e6e657400000000000000000000000000000000000000000000000000 {  // mainnet
                mstore(0x0, 1)
            }
            default {
                revert(0, 0)
            }

            return(0x0, 0x20)
        }
    }
}

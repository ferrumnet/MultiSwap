// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../multiswap-contracts/FeeDistributor.sol";


contract FeeDistributorTest is FeeDistributor {

    uint256 dummyNumber;

    function testDistributeFees(
        address token,
        uint256 preFeeAmount,
        FeeDistributionData memory fdd
    ) external returns (uint256) {
        return _distributeFees(token, preFeeAmount, fdd);
    }

    function setDummyNumber(uint256 _dummyNumber) external {
        dummyNumber = _dummyNumber;
    }

    function getDummyNumber() external view returns (uint256) {
        return dummyNumber;
    }
}

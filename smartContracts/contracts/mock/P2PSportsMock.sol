// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../P2PSports.sol";

contract P2PSportsMock is P2PSports {
    using EnumerableSet for EnumerableSet.AddressSet;

    constructor(address backend_) P2PSports(backend_) {}

    function getAllTokens() external view returns (address[] memory) {
        return _allTokens.values();
    }

    function getOraclessTokens() external view returns (address[] memory) {
        return _oraclessTokens.values();
    }

    function changeChallengeTime(
        uint256 challengeId,
        uint256 startTime,
        uint256 endTime
    ) external onlyBackend {
        _assertChallengeExistence(challengeId);
        Challenge storage _challenge = _challenges[challengeId];
        _challenge.startTime = startTime;
        _challenge.endTime = endTime;
    }
}

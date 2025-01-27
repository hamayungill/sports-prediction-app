// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ChainlinkAggregatorMock {
    int256 public latestPrice;
    uint256 public latestUpdate;

    constructor(int256 initialPrice) {
        latestPrice = initialPrice;
    }

    function setLatestPrice(int256 newPrice) external {
        latestPrice = newPrice;
    }

    function setUpdatedAt(uint256 timestamp) external {
        latestUpdate = timestamp;
    }

    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (1, latestPrice, 0, latestUpdate == 0 ? block.timestamp : latestUpdate, 1);
    }

    function getRoundData(
        uint80 _roundId
    )
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (_roundId, latestPrice, startedAt, updatedAt, answeredInRound);
    }

    function decimals() public pure returns (uint8) {
        return 8;
    }
}

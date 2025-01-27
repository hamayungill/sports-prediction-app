// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ChainlinkAggregatorMock2 {
    int256 public latestPrice;
    uint256 public latestUpdate;
    int256 public latestRoundPriceUpdate;

    constructor(int256 initialPrice) {
        latestPrice = initialPrice;
        latestRoundPriceUpdate = initialPrice;
    }

    function setLatestPrice(int256 newPrice) external {
        latestPrice = newPrice;
        latestRoundPriceUpdate = newPrice;
    }

    function setUpdatedAt(uint256 timestamp) external {
        latestUpdate = timestamp;
    }

    function setRoundDataPrice(int256 newPrice) external {
        latestRoundPriceUpdate = newPrice;
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
        return (_roundId, latestRoundPriceUpdate, startedAt, updatedAt, answeredInRound);
    }

    function decimals() public pure returns (uint8) {
        return 3;
    }
}

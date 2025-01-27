import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { Signer } from "ethers";
import { wei } from "../scripts/utils";

import {
  ERC20Mock,
  P2PSportsMock,
  ChainlinkAggregatorMock,
  ChainlinkAggregatorMock1,
  ChainlinkAggregatorMock2,
  P2PSportsMock__factory,
} from "@/typechain-types";

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

const ChallengeStatus = {
  None: 0,
  CanBeCreated: 1,
  Betting: 2,
  Awaiting: 3,
  Canceled: 4,
  ResolvedFor: 5,
  ResolvedAgainst: 6,
  ResolvedDraw: 7,
};

describe("P2PSports Contract", () => {
  let OWNER: Signer;
  let SECOND: Signer;
  let THIRD: Signer;
  let FOURTH: Signer;

  let BACK: Signer;

  let sports: P2PSportsMock;
  let sports1: P2PSportsMock;
  let sports2: P2PSportsMock;
  let stmx: ERC20Mock;
  let usdc: ERC20Mock;
  let usdt: ERC20Mock;
  let ethOracle: ChainlinkAggregatorMock;
  let ethOracle1: ChainlinkAggregatorMock1;
  let ethOracle2: ChainlinkAggregatorMock2;
  let P2PSportsMock: P2PSportsMock__factory;

  beforeEach("setup", async () => {
    [OWNER, SECOND, THIRD, BACK, FOURTH] = await ethers.getSigners();

    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    const ChainlinkAggregatorMock = await ethers.getContractFactory("ChainlinkAggregatorMock");
    const ChainlinkAggregatorMock1 = await ethers.getContractFactory("ChainlinkAggregatorMock1");
    const ChainlinkAggregatorMock2 = await ethers.getContractFactory("ChainlinkAggregatorMock2");

    P2PSportsMock = await ethers.getContractFactory("P2PSportsMock");

    stmx = await ERC20Mock.deploy();
    usdc = await ERC20Mock.deploy();
    usdt = await ERC20Mock.deploy();
    ethOracle = await ChainlinkAggregatorMock.deploy(10 ** 8 * 1000);
    ethOracle1 = await ChainlinkAggregatorMock1.deploy(10 ** 8 * 1000);
    ethOracle2 = await ChainlinkAggregatorMock2.deploy(10 ** 8 * 1000);

    sports = await P2PSportsMock.deploy(await BACK.getAddress());
    await sports.connect(BACK).updateRoot("0xce4859ac815da091526d7f8e49519a6389c08054773679d5901f47f6215df7a2");

    sports1 = await P2PSportsMock.deploy(await BACK.getAddress());
    await sports1.connect(BACK).updateRoot("0xce4859ac815da091526d7f8e49519a6389c08054773679d5901f47f6215df7a2");

    sports2 = await P2PSportsMock.deploy(await BACK.getAddress());
    await sports2.connect(BACK).updateRoot("0xce4859ac815da091526d7f8e49519a6389c08054773679d5901f47f6215df7a2");

    await sports.allowTokens(
      [stmx.address, usdc.address, ZERO_ADDR],
      [ZERO_ADDR, ZERO_ADDR, ethOracle.address],
      [wei("0.1", 8), wei("0.1", 8), wei("0.1", 8)]
    );
    await sports1.allowTokens(
      [stmx.address, usdc.address, ZERO_ADDR],
      [ZERO_ADDR, ZERO_ADDR, ethOracle1.address],
      [wei("0.1", 8), wei("0.1", 8), wei("0.2", 8)]
    );
    await sports2.allowTokens(
      [stmx.address, usdc.address, ZERO_ADDR],
      [ZERO_ADDR, ZERO_ADDR, ethOracle2.address],
      [wei("0.1", 8), wei("0.1", 8), wei("0.1", 8)]
    );
  });

  describe("constructor()", () => {
    it("should not work properly", async () => {
      await expect(P2PSportsMock.deploy(ZERO_ADDR))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(1);
    });

    it("should set everything correctly", async () => {
      expect(await sports.backend()).to.equal(await BACK.getAddress());
      expect(await sports.getAllowedTokens()).to.deep.equal([stmx.address, usdc.address, ZERO_ADDR]);
      expect(await sports.getAllTokens()).to.deep.equal([stmx.address, usdc.address, ZERO_ADDR]);
      expect(await sports.getOraclessTokens()).to.deep.equal([stmx.address, usdc.address]);
      expect(await sports.MAX_ADMIN_SHARE_IN_USD()).to.deep.equal(wei("1000", 8));
      expect(await sports.MAX_ADMIN_SHARE_STMX()).to.deep.equal(wei("100000", 18));
      expect(await sports.maxChallengersPerChallenge()).to.deep.equal(50);
      expect(await sports.MAX_WINNERS_PER_CHALLENGE()).to.deep.equal(10);
      expect(await sports.MAX_CHALLENGES_TO_CREATE_JOIN()).to.deep.equal(10);
      expect(await sports.bettingAllowed()).to.deep.equal(true);
      expect(await sports.DEFAULT_ORACLE_DECIMALS()).to.deep.equal(8);
      expect(await sports.minUSDBetAmount()).to.deep.equal(1000000000);
      expect(await sports.PRICE_FEED_ERROR_MARGIN()).to.deep.equal(5);
      expect(await sports.MAX_ADMIN_SHARE_THRESHOLDS()).to.deep.equal(20);
      expect(await sports.MAX_FOR_MIN_USD_BET_AMOUNT()).to.deep.equal(10000000000);
      expect(await sports.AWAITING_TIME_FOR_OWNER_CANCEL()).to.deep.equal(172800);
    });

    it("should not change backend", async () => {
      await expect(sports.changeBackend(ZERO_ADDR))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(1);
    });

    it("should change backend", async () => {
      expect(await sports.backend()).to.equal(await BACK.getAddress());

      await sports.changeBackend(await OWNER.getAddress());

      expect(await sports.backend()).to.equal(await OWNER.getAddress());
    });

    it("should set betting", async () => {
      await sports.allowBetting(false);
      expect(await sports.bettingAllowed()).to.equal(false);

      await sports.allowBetting(true);
      expect(await sports.bettingAllowed()).to.equal(true);
    });
  });

  describe("access", () => {
    it("only owner should call these functions", async () => {
      await expect(sports.connect(SECOND).changeBackend(ZERO_ADDR)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );

      await expect(sports.connect(SECOND).allowBetting(true)).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(sports.connect(SECOND).allowTokens([ZERO_ADDR], [ZERO_ADDR], [0])).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
      await expect(sports.connect(SECOND).restrictTokens([ZERO_ADDR])).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
      await expect(sports.connect(SECOND).setAdminShareRules([1], [1], stmx.address, true)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );

      await expect(sports.connect(SECOND).cancelParticipation(ZERO_ADDR, 1, 1))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(41);

      await expect(sports.connect(SECOND).changeChallengeTime(1, 0, 0))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(41);

      await expect(sports.connect(SECOND).changeMinUSDBettingAmount(100000000)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );

      await expect(sports.connect(SECOND).updateApplyMembershipValues(true)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );

      await expect(sports.connect(SECOND).debitInSC(1, ZERO_ADDR)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );

      await expect(sports.connect(SECOND).renounceOwnership()).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        sports.connect(SECOND).updateRoot("0xd352eb8473d556192f5df0dc6a5351b4ff1466a57995cfa332a5246783eaff87")
      )
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(41);
    });

    it("only backend should call these functions", async () => {
      await expect(sports.connect(SECOND).resolveChallenge(1, [ZERO_ADDR], [wei(100)]))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(41);
    });

    it("only backend or owner should call these functions", async () => {
      await expect(sports.connect(SECOND).cancelChallenge(1, 0))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(42);
    });
  });

  describe("tokens", () => {
    it("should not allow tokens", async () => {
      await expect(sports.allowTokens([ZERO_ADDR], [], []))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(9);

      await expect(sports.allowTokens([usdc.address], [ZERO_ADDR], [wei("0.1", 8)]))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(46);

      await expect(sports.allowTokens([usdt.address], [ZERO_ADDR], [wei("0", 8)]))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(20);

      // invalid price feed cases
      await ethOracle1.setUpdatedAt((await time.latest()) - 172800);

      await expect(sports1.allowTokens([usdt.address], [ethOracle1.address], [wei("0.1", 8)]))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(25);

      await ethOracle1.setLatestPrice(0);

      await expect(sports1.allowTokens([usdt.address], [ethOracle1.address], [wei("0.1", 8)]))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(19);

      await ethOracle2.setLatestPrice(wei("2", 8));
      await ethOracle2.setUpdatedAt(await time.latest());
      await ethOracle2.setRoundDataPrice(wei("1", 8));

      await expect(sports2.allowTokens([usdt.address], [ethOracle2.address], [wei("2", 8)]))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(27);
    });

    it("should not restrict tokens", async () => {
      await expect(sports.restrictTokens([usdt.address]))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(47);
    });

    it("should restrict tokens", async () => {
      expect(await sports.getAllowedTokens()).to.deep.equal([stmx.address, usdc.address, ZERO_ADDR]);
      expect(await sports.getAllTokens()).to.deep.equal([stmx.address, usdc.address, ZERO_ADDR]);
      expect(await sports.getOraclessTokens()).to.deep.equal([stmx.address, usdc.address]);

      await sports.restrictTokens([stmx.address]);

      expect(await sports.getAllowedTokens()).to.deep.equal([ZERO_ADDR, usdc.address]);
      expect(await sports.getAllTokens()).to.deep.equal([stmx.address, usdc.address, ZERO_ADDR]);
      expect(await sports.getOraclessTokens()).to.deep.equal([usdc.address]);
    });
  });

  describe("admin share rules", () => {
    it("should not set share rules", async () => {
      await expect(sports.setAdminShareRules([1, 2], [2, 1], usdt.address, false))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(48);
      await expect(sports.setAdminShareRules([], [], ZERO_ADDR, false))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(9);
      await expect(sports.setAdminShareRules([1], [], ZERO_ADDR, false))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(9);

      await expect(sports.setAdminShareRules([2, 1], [2, 1], ZERO_ADDR, false))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(21);
      await expect(sports.setAdminShareRules([1, 2], [wei("1", 30), 1], ZERO_ADDR, false))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(22);
      await expect(sports.setAdminShareRules([1, 2], [1, wei("1", 30)], ZERO_ADDR, false))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(22);
    });

    it("should get share rules for STMX", async () => {
      const adminShares1 = [
        [
          wei("2250", 8),
          wei("3001", 8),
          wei("15001", 8),
          wei("70001", 8),
          wei("150001", 8),
          wei("700001", 8),
          wei("1350001", 8),
        ],
        [wei("10", 8), wei("8", 8), wei("3.5", 8), wei("2", 8), wei("2.5", 8), wei("3.5", 8), wei("4.5", 8)],
      ];

      const adminShares2 = [
        [wei("10", 8), wei("21", 8), wei("101", 8), wei("501", 8), wei("1001", 8), wei("5001", 8), wei("10001", 8)],
        [wei("16", 8), wei("10", 8), wei("4", 8), wei("2.5", 8), wei("3.5", 8), wei("4.5", 8), wei("5", 8)],
      ];

      // STMX rules
      await sports.setAdminShareRules(adminShares1[0], adminShares1[1], stmx.address, true);

      // USD rules
      await sports.setAdminShareRules(adminShares2[0], adminShares2[1], usdc.address, false);

      expect(await sports.getAdminShareRules(usdc.address)).to.deep.equal([...adminShares2, false]);
      expect(await sports.getAdminShareRules(stmx.address)).to.deep.equal([...adminShares1, true]);
    });
  });

  describe("createChallenges()", () => {
    beforeEach("setup", async () => {
      await stmx.mint(await OWNER.getAddress(), wei("1"));
      await stmx.mint(await THIRD.getAddress(), wei("1"));

      await stmx.approve(sports.address, wei("1"));
      await stmx.connect(THIRD).approve(sports.address, wei("1"));
    });

    it("should not create challenge", async () => {
      await expect(
        sports.createChallenges(
          [
            {
              token: stmx.address,
              amountFromWallet: wei("0.1"),
              amountFromWithdrawables: 0,
              startTime: (await time.latest()) + 1000000,
              endTime: await time.latest(),
            },
          ],
          1,
          wei("5"),
          "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          wei("10"),
          [
            "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
            "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
          ]
        )
      )
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(2);

      await expect(
        sports.createChallenges(
          [
            {
              token: stmx.address,
              amountFromWallet: wei("0.1"),
              amountFromWithdrawables: 0,
              startTime: await time.latest(),
              endTime: (await time.latest()) - 10000,
            },
          ],
          1,
          wei("5"),
          "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          wei("10"),
          [
            "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
            "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
          ]
        )
      )
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(2);

      await expect(
        sports.createChallenges(
          [
            {
              token: await SECOND.getAddress(),
              amountFromWallet: 0,
              amountFromWithdrawables: 0,
              startTime: await time.latest(),
              endTime: (await time.latest()) + 100000000,
            },
          ],
          1,
          wei("5"),
          "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          wei("10"),
          [
            "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
            "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
          ]
        )
      )
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(3);

      await expect(
        sports.createChallenges(
          [
            {
              token: stmx.address,
              amountFromWallet: 0,
              amountFromWithdrawables: 0,
              startTime: await time.latest(),
              endTime: (await time.latest()) + 100000000,
            },
          ],
          1,
          wei("5"),
          "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          wei("10"),
          [
            "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
            "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
          ]
        )
      )
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(35);

      await expect(
        sports.createChallenges(
          [
            {
              token: ZERO_ADDR,
              amountFromWallet: 0,
              amountFromWithdrawables: 0,
              startTime: await time.latest(),
              endTime: (await time.latest()) + 100000000,
            },
          ],
          1,
          wei("5"),
          "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          wei("10"),
          [
            "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
            "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
          ],
          {
            value: wei("1"),
          }
        )
      )
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(33);

      await expect(
        sports.createChallenges(
          [
            {
              token: ZERO_ADDR,
              amountFromWallet: wei("0.0000001"),
              amountFromWithdrawables: 0,
              startTime: await time.latest(),
              endTime: (await time.latest()) + 100000000,
            },
          ],
          1,
          wei("5"),
          "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          wei("10"),
          [
            "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
            "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
          ],
          {
            value: wei("0.0000001"),
          }
        )
      )
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(28);

      await expect(
        sports.createChallenges(
          [
            {
              token: stmx.address,
              amountFromWallet: wei("0.0000001"),
              amountFromWithdrawables: 0,
              startTime: await time.latest(),
              endTime: (await time.latest()) + 100000000,
            },
          ],
          1,
          wei("5"),
          "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          wei("10"),
          [
            "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
            "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
          ]
        )
      )
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(28);

      await expect(
        sports.createChallenges(
          [
            {
              token: stmx.address,
              amountFromWallet: wei("0.1"),
              amountFromWithdrawables: 0,
              startTime: (await time.latest()) + 1000000,
              endTime: await time.latest(),
            },
            {
              token: stmx.address,
              amountFromWallet: wei("0.1"),
              amountFromWithdrawables: 0,
              startTime: (await time.latest()) + 1000000,
              endTime: await time.latest(),
            },
            {
              token: stmx.address,
              amountFromWallet: wei("0.1"),
              amountFromWithdrawables: 0,
              startTime: (await time.latest()) + 1000000,
              endTime: await time.latest(),
            },
            {
              token: stmx.address,
              amountFromWallet: wei("0.1"),
              amountFromWithdrawables: 0,
              startTime: (await time.latest()) + 1000000,
              endTime: await time.latest(),
            },
            {
              token: stmx.address,
              amountFromWallet: wei("0.1"),
              amountFromWithdrawables: 0,
              startTime: (await time.latest()) + 1000000,
              endTime: await time.latest(),
            },
            {
              token: stmx.address,
              amountFromWallet: wei("0.1"),
              amountFromWithdrawables: 0,
              startTime: (await time.latest()) + 1000000,
              endTime: await time.latest(),
            },
            {
              token: stmx.address,
              amountFromWallet: wei("0.1"),
              amountFromWithdrawables: 0,
              startTime: (await time.latest()) + 1000000,
              endTime: await time.latest(),
            },
            {
              token: stmx.address,
              amountFromWallet: wei("0.1"),
              amountFromWithdrawables: 0,
              startTime: (await time.latest()) + 1000000,
              endTime: await time.latest(),
            },
            {
              token: stmx.address,
              amountFromWallet: wei("0.1"),
              amountFromWithdrawables: 0,
              startTime: (await time.latest()) + 1000000,
              endTime: await time.latest(),
            },
            {
              token: stmx.address,
              amountFromWallet: wei("0.1"),
              amountFromWithdrawables: 0,
              startTime: (await time.latest()) + 1000000,
              endTime: await time.latest(),
            },
            {
              token: stmx.address,
              amountFromWallet: wei("0.1"),
              amountFromWithdrawables: 0,
              startTime: (await time.latest()) + 1000000,
              endTime: await time.latest(),
            },
          ],
          1,
          wei("5"),
          "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          wei("10"),
          [
            "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
            "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
          ]
        )
      )
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(9);
    });

    it("should not get challenge details", async () => {
      await expect(sports.getChallengeDetails(1))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(38);
    });

    it("should correctly create challenge", async () => {
      await sports.connect(OWNER).createChallenges(
        [
          {
            token: stmx.address,
            amountFromWallet: wei("0.1"),
            amountFromWithdrawables: 0,
            startTime: await time.latest(),
            endTime: (await time.latest()) + 100000000,
          },
        ],
        1,
        wei("5"),
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        wei("10"),
        [
          "0x4e232da8604bb729b93c6612f6cba9ad2d3bf6acc807ecbf7e3457ac566c1223",
          "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
        ]
      );

      let details = await sports.getChallengeDetails(1);

      expect(await sports.latestChallengeId()).to.equal(1);

      expect(details.token).to.equal(stmx.address);
      expect(details.users).to.deep.equal([await OWNER.getAddress()]);
      expect(details.amount).to.equal(wei("0.1"));
      expect(details.status).to.equal(ChallengeStatus.Betting);

      let bet = await sports.getUserBet(1, await OWNER.getAddress());

      expect(bet.amount).to.equal(wei("0.1"));
    });

    it("should create native challenge with oracle", async () => {
      await sports.createChallenges(
        [
          {
            token: ZERO_ADDR,
            amountFromWallet: "1000000000000000000",
            amountFromWithdrawables: 0,
            startTime: await time.latest(),
            endTime: (await time.latest()) + 100000000,
          },
        ],
        1,
        wei("5"),
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        wei("10"),
        [
          "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
          "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
        ],
        { value: "1000000000000000000" }
      );

      const details = await sports.getChallengeDetails(1);

      expect(details.token).to.equal(ZERO_ADDR);
      expect(details.users).to.deep.equal([await OWNER.getAddress()]);
      expect(details.amount).to.equal(wei("1"));
      expect(details.status).to.equal(ChallengeStatus.Betting);
    });

    it("should not create invalid membership and points", async () => {
      await sports.updateApplyMembershipValues(true);
      await expect(
        sports.createChallenges(
          [
            {
              token: ZERO_ADDR,
              amountFromWallet: "1000000000000000000",
              amountFromWithdrawables: 0,
              startTime: await time.latest(),
              endTime: (await time.latest()) + 100000000,
            },
          ],
          1,
          wei("1"),
          "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          wei("10"),
          [
            "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
            "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
          ],
          { value: "1000000000000000000" }
        )
      )
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(45);
    });

    it("Should validate the challenge", async () => {
      await sports.createChallenges(
        [
          {
            token: ZERO_ADDR,
            amountFromWallet: "1000000000000000000",
            amountFromWithdrawables: 0,
            startTime: await time.latest(),
            endTime: (await time.latest()) + 100000000,
          },
        ],
        1,
        wei("5"),
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        wei("10"),
        [
          "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
          "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
        ],
        { value: "1000000000000000000" }
      );
      expect(await sports.challengeExists(1)).to.equal(true);
      expect(await sports.challengeExists(2)).to.equal(false);
    });
  });

  describe("joinChallenge()", () => {
    beforeEach("setup", async () => {
      await stmx.mint(await OWNER.getAddress(), wei("2"));
      await stmx.mint(await SECOND.getAddress(), wei("2"));

      await stmx.approve(sports.address, wei("1"));
      await stmx.connect(SECOND).approve(sports.address, wei("1"));
    });

    it("should not join challenge", async () => {
      await sports.createChallenges(
        [
          {
            token: stmx.address,
            amountFromWallet: wei("0.1"),
            amountFromWithdrawables: 0,
            startTime: await time.latest(),
            endTime: (await time.latest()) + 100000000,
          },
        ],
        1,
        wei("5"),
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        wei("10"),
        [
          "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
          "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
        ]
      );
      await sports.createChallenges(
        [
          {
            token: stmx.address,
            amountFromWallet: wei("0.1"),
            amountFromWithdrawables: 0,
            startTime: await time.latest(),
            endTime: (await time.latest()) + 100000000,
          },
        ],
        1,
        wei("5"),
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        wei("10"),
        [
          "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
          "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
        ]
      );

      await expect(
        sports.connect(SECOND).joinChallenges(
          [
            {
              challengeId: 1337,
              amountFromWallet: wei("1"),
              amountFromWithdrawables: 0,
            },
          ],
          2,
          wei("10"),
          "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
          wei("12.5"),
          [
            "0x7d0cf3a59f8740f42727f7f35163b5249e1796a487af22d7d9d00b55af56d29c",
            "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
          ]
        )
      )
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(38);

      await expect(
        sports
          .connect(SECOND)
          .joinChallenges(
            [{ challengeId: 1, amountFromWallet: 0, amountFromWithdrawables: 0 }],
            2,
            wei("10"),
            "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
            wei("12.5"),
            [
              "0x7d0cf3a59f8740f42727f7f35163b5249e1796a487af22d7d9d00b55af56d29c",
              "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
            ]
          )
      )
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(35);

      await expect(
        sports.connect(SECOND).joinChallenges(
          [
            {
              challengeId: 1,
              amountFromWallet: wei("0.1"),
              amountFromWithdrawables: wei("0.1"),
            },
          ],
          2,
          wei("10"),
          "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
          wei("12.5"),
          [
            "0x7d0cf3a59f8740f42727f7f35163b5249e1796a487af22d7d9d00b55af56d29c",
            "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
          ]
        )
      )
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(36);

      await sports.allowBetting(false);

      await sports.allowBetting(true);

      await sports.connect(BACK).changeChallengeTime(1, (await time.latest()) - 10000, (await time.latest()) - 5000);

      await expect(
        sports
          .connect(SECOND)
          .joinChallenges(
            [{ challengeId: 1, amountFromWallet: wei("1"), amountFromWithdrawables: 0 }],
            2,
            wei("10"),
            "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
            wei("12.5"),
            [
              "0x7d0cf3a59f8740f42727f7f35163b5249e1796a487af22d7d9d00b55af56d29c",
              "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
            ]
          )
      )
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(32);

      await sports.createChallenges(
        [
          {
            token: ZERO_ADDR,
            amountFromWallet: wei("0.1"),
            amountFromWithdrawables: 0,
            startTime: await time.latest(),
            endTime: (await time.latest()) + 100000000,
          },
        ],
        1,
        wei("5"),
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        wei("10"),
        [
          "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
          "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
        ],
        { value: wei("0.1") }
      );
      await expect(
        sports.connect(SECOND).joinChallenges(
          [
            {
              challengeId: 3,
              amountFromWallet: wei("1"),
              amountFromWithdrawables: 0,
            },
          ],
          2,
          wei("10"),
          "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
          wei("12.5"),
          [
            "0x7d0cf3a59f8740f42727f7f35163b5249e1796a487af22d7d9d00b55af56d29c",
            "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
          ],
          { value: wei("10") }
        )
      )
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(33);

      await expect(
        sports.connect(SECOND).joinChallenges(
          [
            {
              challengeId: 2,
              amountFromWallet: 0,
              amountFromWithdrawables: 0,
            },
          ],
          2,
          wei("10"),
          "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
          wei("12.5"),
          [
            "0x7d0cf3a59f8740f42727f7f35163b5249e1796a487af22d7d9d00b55af56d29c",
            "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
          ],
          { value: wei("10") }
        )
      )
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(34);

      await expect(
        sports.joinChallenges(
          [
            {
              challengeId: 1,
              amountFromWallet: wei("0.1"),
              amountFromWithdrawables: 0,
            },
            {
              challengeId: 1,
              amountFromWallet: wei("0.1"),
              amountFromWithdrawables: 0,
            },
            {
              challengeId: 1,
              amountFromWallet: wei("0.1"),
              amountFromWithdrawables: 0,
            },
            {
              challengeId: 1,
              amountFromWallet: wei("0.1"),
              amountFromWithdrawables: 0,
            },
            {
              challengeId: 1,
              amountFromWallet: wei("0.1"),
              amountFromWithdrawables: 0,
            },
            {
              challengeId: 1,
              amountFromWallet: wei("0.1"),
              amountFromWithdrawables: 0,
            },
            {
              challengeId: 1,
              amountFromWallet: wei("0.1"),
              amountFromWithdrawables: 0,
            },
            {
              challengeId: 1,
              amountFromWallet: wei("0.1"),
              amountFromWithdrawables: 0,
            },
            {
              challengeId: 1,
              amountFromWallet: wei("0.1"),
              amountFromWithdrawables: 0,
            },
            {
              challengeId: 1,
              amountFromWallet: wei("0.1"),
              amountFromWithdrawables: 0,
            },
            {
              challengeId: 1,
              amountFromWallet: wei("0.1"),
              amountFromWithdrawables: 0,
            },
          ],
          1,
          wei("5"),
          "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          wei("10"),
          [
            "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
            "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
          ]
        )
      )
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(9);
    });

    it("should not join if max challengers reached", async () => {
      await sports.updateMaxChallengers(1);

      await sports.createChallenges(
        [
          {
            token: stmx.address,
            amountFromWallet: wei("0.1"),
            amountFromWithdrawables: 0,
            startTime: await time.latest(),
            endTime: (await time.latest()) + 100000000,
          },
        ],
        1,
        wei("5"),
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        wei("10"),
        [
          "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
          "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
        ]
      );

      await expect(
        sports
          .connect(SECOND)
          .joinChallenges(
            [{ challengeId: 1, amountFromWallet: wei("0.5"), amountFromWithdrawables: 0 }],
            2,
            wei("10"),
            "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
            wei("12.5"),
            [
              "0x7d0cf3a59f8740f42727f7f35163b5249e1796a487af22d7d9d00b55af56d29c",
              "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
            ]
          )
      )
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(30);
    });

    it("should correctly join challenge with only wallet amount", async () => {
      await sports.createChallenges(
        [
          {
            token: stmx.address,
            amountFromWallet: wei("0.1"),
            amountFromWithdrawables: 0,
            startTime: await time.latest(),
            endTime: (await time.latest()) + 100000000,
          },
        ],
        1,
        wei("5"),
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        wei("10"),
        [
          "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
          "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
        ]
      );
      await sports
        .connect(SECOND)
        .joinChallenges(
          [{ challengeId: 1, amountFromWallet: wei("0.5"), amountFromWithdrawables: 0 }],
          2,
          wei("10"),
          "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
          wei("12.5"),
          [
            "0x5439b40306349ef74da5b40456de24b827d571d6c6b9638b5bf6561b20e6195b",
            "0xe34752b3b1bd6af1fe28b37a680fefb2aea11d2f1954debe15ba6953cb595dc7",
          ]
        );

      await expect(
        sports
          .connect(SECOND)
          .joinChallenges(
            [{ challengeId: 1, amountFromWallet: wei("0.5"), amountFromWithdrawables: 0 }],
            2,
            wei("10"),
            "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
            wei("12.5"),
            [
              "0x7d0cf3a59f8740f42727f7f35163b5249e1796a487af22d7d9d00b55af56d29c",
              "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
            ]
          )
      )
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(6);

      const details = await sports.getChallengeDetails(1);

      expect(details.users).to.deep.equal([await OWNER.getAddress(), await SECOND.getAddress()]);
      expect(details.amount).to.equal(wei("0.6"));
      expect(details.status).to.equal(ChallengeStatus.Betting);
    });

    it("should correctly join challenge with withdrawables amount", async () => {
      await sports.createChallenges(
        [
          {
            token: stmx.address,
            amountFromWallet: wei("0.1"),
            amountFromWithdrawables: 0,
            startTime: await time.latest(),
            endTime: (await time.latest()) + 2,
          },
        ],
        1,
        wei("5"),
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        wei("10"),
        [
          "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
          "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
        ]
      );
      await sports
        .connect(SECOND)
        .joinChallenges(
          [{ challengeId: 1, amountFromWallet: wei("0.5"), amountFromWithdrawables: 0 }],
          2,
          wei("10"),
          "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
          wei("12.5"),
          [
            "0x5439b40306349ef74da5b40456de24b827d571d6c6b9638b5bf6561b20e6195b",
            "0xe34752b3b1bd6af1fe28b37a680fefb2aea11d2f1954debe15ba6953cb595dc7",
          ]
        );

      await sports.connect(BACK).resolveChallenge(1, [await SECOND.getAddress()], [wei(100)]);

      await sports.createChallenges(
        [
          {
            token: stmx.address,
            amountFromWallet: wei("0.1"),
            amountFromWithdrawables: 0,
            startTime: await time.latest(),
            endTime: (await time.latest()) + 100000000,
          },
        ],
        1,
        wei("5"),
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        wei("10"),
        [
          "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
          "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
        ]
      );
      await sports
        .connect(SECOND)
        .joinChallenges(
          [{ challengeId: 2, amountFromWallet: 0, amountFromWithdrawables: wei("0.4") }],
          2,
          wei("10"),
          "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
          wei("12.5"),
          [
            "0x5439b40306349ef74da5b40456de24b827d571d6c6b9638b5bf6561b20e6195b",
            "0xe34752b3b1bd6af1fe28b37a680fefb2aea11d2f1954debe15ba6953cb595dc7",
          ]
        );

      const details = await sports.getChallengeDetails(2);

      expect(details.users).to.deep.equal([await OWNER.getAddress(), await SECOND.getAddress()]);
      expect(details.amount).to.equal(wei("0.5"));
      expect(details.status).to.equal(ChallengeStatus.Betting);

      let withdrawables = await sports.getUserWithdrawables(await SECOND.getAddress());

      expect(withdrawables.tokens).to.deep.equal([stmx.address, usdc.address, ZERO_ADDR]);
      expect(withdrawables.amounts).to.deep.equal([wei("0.2"), 0, 0]);
    });

    it("should correctly join challenge with both wallet and withdrawables amount", async () => {
      await sports.createChallenges(
        [
          {
            token: stmx.address,
            amountFromWallet: wei("0.1"),
            amountFromWithdrawables: 0,
            startTime: await time.latest(),
            endTime: (await time.latest()) + 2,
          },
        ],
        1,
        wei("5"),
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        wei("10"),
        [
          "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
          "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
        ]
      );
      await sports
        .connect(SECOND)
        .joinChallenges(
          [{ challengeId: 1, amountFromWallet: wei("0.5"), amountFromWithdrawables: 0 }],
          2,
          wei("10"),
          "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
          wei("12.5"),
          [
            "0x5439b40306349ef74da5b40456de24b827d571d6c6b9638b5bf6561b20e6195b",
            "0xe34752b3b1bd6af1fe28b37a680fefb2aea11d2f1954debe15ba6953cb595dc7",
          ]
        );

      await sports.connect(BACK).resolveChallenge(1, [await SECOND.getAddress()], [wei(100)]);

      await sports.createChallenges(
        [
          {
            token: stmx.address,
            amountFromWallet: wei("0.1"),
            amountFromWithdrawables: 0,
            startTime: await time.latest(),
            endTime: (await time.latest()) + 100000000,
          },
        ],
        1,
        wei("5"),
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        wei("10"),
        [
          "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
          "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
        ]
      );
      await sports.connect(SECOND).joinChallenges(
        [
          {
            challengeId: 2,
            amountFromWallet: wei("0.1"),
            amountFromWithdrawables: wei("0.1"),
          },
        ],
        2,
        wei("10"),
        "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        wei("12.5"),
        [
          "0x7d0cf3a59f8740f42727f7f35163b5249e1796a487af22d7d9d00b55af56d29c",
          "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
        ]
      );

      const details = await sports.getChallengeDetails(2);

      expect(details.users).to.deep.equal([await OWNER.getAddress(), await SECOND.getAddress()]);
      expect(details.amount).to.equal(wei("0.3"));
      expect(details.status).to.equal(ChallengeStatus.Betting);

      let withdrawables = await sports.getUserWithdrawables(await SECOND.getAddress());

      expect(withdrawables.tokens).to.deep.equal([stmx.address, usdc.address, ZERO_ADDR]);
      expect(withdrawables.amounts).to.deep.equal([wei("0.5"), 0, 0]);
    });
  });

  describe("joinChallenge() with admin shares", () => {
    beforeEach("setup", async () => {
      await stmx.mint(await OWNER.getAddress(), wei("10000000"));

      await stmx.approve(sports.address, wei("10000000"));

      // STMX rules for sports
      await sports.setAdminShareRules(
        [
          wei("2250", 8),
          wei("3001", 8),
          wei("15001", 8),
          wei("70001", 8),
          wei("150001", 8),
          wei("700001", 8),
          wei("1350001", 8),
        ],
        [wei("10", 8), wei("8", 8), wei("3.5", 8), wei("2", 8), wei("2.5", 8), wei("3.5", 8), wei("4.5", 8)],
        stmx.address,
        true
      );

      // USD rules for sports
      await sports.setAdminShareRules(
        [wei("10", 8), wei("21", 8), wei("101", 8), wei("501", 8), wei("1001", 8), wei("5001", 8), wei("10001", 8)],
        [wei("16", 8), wei("10", 8), wei("4", 8), wei("2.5", 8), wei("3.5", 8), wei("4.5", 8), wei("5", 8)],
        usdc.address,
        false
      );

      // ETH rules for sports
      await sports.setAdminShareRules(
        [wei("10", 8), wei("21", 8), wei("101", 8), wei("501", 8), wei("1001", 8), wei("5001", 8), wei("10001", 8)],
        [wei("16", 8), wei("10", 8), wei("4", 8), wei("2.5", 8), wei("3.5", 8), wei("4.5", 8), wei("5", 8)],
        ZERO_ADDR,
        false
      );

      // STMX rules for sports1
      await sports1.setAdminShareRules(
        [
          wei("2250", 8),
          wei("3001", 8),
          wei("15001", 8),
          wei("70001", 8),
          wei("150001", 8),
          wei("700001", 8),
          wei("1350001", 8),
        ],
        [wei("10", 8), wei("8", 8), wei("3.5", 8), wei("2", 8), wei("2.5", 8), wei("3.5", 8), wei("4.5", 8)],
        stmx.address,
        true
      );

      // USD rules for sports1
      await sports1.setAdminShareRules(
        [wei("10", 8), wei("21", 8), wei("101", 8), wei("501", 8), wei("1001", 8), wei("5001", 8), wei("10001", 8)],
        [wei("16", 8), wei("10", 8), wei("4", 8), wei("2.5", 8), wei("3.5", 8), wei("4.5", 8), wei("5", 8)],
        usdc.address,
        false
      );

      // ETH rules for sports
      await sports1.setAdminShareRules(
        [wei("10", 8), wei("21", 8), wei("101", 8), wei("501", 8), wei("1001", 8), wei("5001", 8), wei("10001", 8)],
        [wei("16", 8), wei("10", 8), wei("4", 8), wei("2.5", 8), wei("3.5", 8), wei("4.5", 8), wei("5", 8)],
        ZERO_ADDR,
        false
      );
    });

    it("should not join challenge is oracle malfunctions", async () => {
      await ethOracle.setLatestPrice(0);

      await expect(
        sports.createChallenges(
          [
            {
              token: ZERO_ADDR,
              amountFromWallet: wei("0.1"),
              amountFromWithdrawables: 0,
              startTime: await time.latest(),
              endTime: (await time.latest()) + 10000000,
            },
          ],
          1,
          wei("5"),
          "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          wei("10"),
          [
            "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
            "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
          ],
          {
            value: wei("0.1"),
          }
        )
      )
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(43);

      await ethOracle.setLatestPrice(wei("1", 8));
      await ethOracle.setUpdatedAt(1);

      await expect(
        sports.createChallenges(
          [
            {
              token: ZERO_ADDR,
              amountFromWallet: wei("0.1"),
              amountFromWithdrawables: 0,
              startTime: await time.latest(),
              endTime: (await time.latest()) + 100000000,
            },
          ],
          1,
          wei("5"),
          "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          wei("10"),
          [
            "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
            "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
          ],
          {
            value: wei("0.1"),
          }
        )
      )
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(43);
    });

    it("should correctly calculate admin shares", async () => {
      await sports.updateApplyMembershipValues(true);

      await sports.createChallenges(
        [
          {
            token: stmx.address,
            amountFromWallet: wei("100000"),
            amountFromWithdrawables: 0,
            startTime: await time.latest(),
            endTime: (await time.latest()) + 100000000,
          },
        ],
        1,
        wei("5"),
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        wei("10"),
        [
          "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
          "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
        ]
      );

      const bet = await sports.getUserBet(1, await OWNER.getAddress());

      expect(bet.amount).to.equal(wei("99999.9999999998001"));

      await sports.connect(BACK).changeChallengeTime(1, (await time.latest()) - 10000, (await time.latest()) - 5000);
      await sports.connect(BACK).resolveChallenge(1, [await OWNER.getAddress()], [wei(100)]);
      let adminWithdrawables = await sports.getUserWithdrawables(await OWNER.getAddress());

      expect(adminWithdrawables.tokens).to.deep.equal([stmx.address, usdc.address, ZERO_ADDR]);
      expect(adminWithdrawables.amounts).to.deep.equal([wei("99999.9999999999998001"), 0, 0]);

      adminWithdrawables = await sports.getUserWithdrawables("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
      expect(adminWithdrawables.amounts).to.deep.equal([wei("0.0000000000001999"), 0, 0]);
    });

    it("should correctly calculate native admin shares", async () => {
      await sports.updateApplyMembershipValues(true);

      await sports.createChallenges(
        [
          {
            token: ZERO_ADDR,
            amountFromWallet: wei("1"),
            amountFromWithdrawables: 0,
            startTime: await time.latest(),
            endTime: (await time.latest()) + 100000000,
          },
        ],
        1,
        wei("5"),
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        wei("10"),
        [
          "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
          "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
        ],
        { value: wei("1") }
      );

      const bet = await sports.getUserBet(1, await OWNER.getAddress());
      expect(bet.amount).to.equal(wei("0.99750125"));

      await sports.connect(BACK).changeChallengeTime(1, (await time.latest()) - 10000, (await time.latest()) - 5000);
      await sports.connect(BACK).resolveChallenge(1, [await OWNER.getAddress()], [wei(100)]);

      const adminWithdrawables = await sports.getUserWithdrawables(await OWNER.getAddress());

      expect(adminWithdrawables.tokens).to.deep.equal([stmx.address, usdc.address, ZERO_ADDR]);
      expect(adminWithdrawables.amounts).to.deep.equal([0, 0, wei("0.99999750125")]);

      await sports1.updateApplyMembershipValues(true);

      await sports1.createChallenges(
        [
          {
            token: ZERO_ADDR,
            amountFromWallet: wei("2"),
            amountFromWithdrawables: 0,
            startTime: await time.latest(),
            endTime: (await time.latest()) + 100000000,
          },
        ],
        1,
        wei("5"),
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        wei("10"),
        [
          "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
          "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
        ],
        { value: wei("2") }
      );

      const bet1 = await sports1.getUserBet(1, await OWNER.getAddress());

      expect(bet1.amount).to.equal(wei("0.4008"));

      await sports1.connect(BACK).changeChallengeTime(1, (await time.latest()) - 10000, (await time.latest()) - 5000);
      await sports1.connect(BACK).resolveChallenge(1, [await OWNER.getAddress()], [wei(100)]);

      const adminWithdrawables1 = await sports1.getUserWithdrawables(await OWNER.getAddress());

      expect(adminWithdrawables1.tokens).to.deep.equal([stmx.address, usdc.address, ZERO_ADDR]);
      expect(adminWithdrawables1.amounts).to.deep.equal([0, 0, wei("1.9984008")]);

      await sports2.updateApplyMembershipValues(true);

      await sports2.connect(FOURTH).createChallenges(
        [
          {
            token: ZERO_ADDR,
            amountFromWallet: wei("1"),
            amountFromWithdrawables: 0,
            startTime: await time.latest(),
            endTime: (await time.latest()) + 100000000,
          },
        ],
        1,
        wei("20"),
        "0x0000000000000000000000000000000000000000",
        wei("20"),
        [
          "0x4e232da8604bb729b93c6612f6cba9ad2d3bf6acc807ecbf7e3457ac566c1223",
          "0xe34752b3b1bd6af1fe28b37a680fefb2aea11d2f1954debe15ba6953cb595dc7",
        ],
        { value: wei("1") }
      );
    });

    it("should not withdraw admin shares", async () => {
      await expect(sports.withdraw(ZERO_ADDR)).to.revertedWithCustomError(P2PSportsMock, "ErrorMessage").withArgs(8);
    });

    it("should correctly withdraw admin shares", async () => {
      await sports.updateApplyMembershipValues(true);
      await sports.createChallenges(
        [
          {
            token: stmx.address,
            amountFromWallet: wei("100000"),
            amountFromWithdrawables: 0,
            startTime: await time.latest(),
            endTime: (await time.latest()) + 100000000,
          },
        ],
        1,
        wei("5"),
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        wei("10"),
        [
          "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
          "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
        ]
      );

      const bet = await sports.getUserBet(1, await OWNER.getAddress());

      expect(bet.amount).to.equal(wei("99999.9999999998001"));
      await sports.connect(BACK).changeChallengeTime(1, (await time.latest()) - 10000, (await time.latest()) - 5000);
      await sports.connect(BACK).resolveChallenge(1, [await OWNER.getAddress()], [wei(100)]);

      let adminWithdrawables = await sports.getUserWithdrawables(await OWNER.getAddress());

      expect(adminWithdrawables.tokens).to.deep.equal([stmx.address, usdc.address, ZERO_ADDR]);
      expect(adminWithdrawables.amounts).to.deep.equal([wei("99999.9999999999998001"), 0, 0]);

      expect(await stmx.balanceOf(await BACK.getAddress())).to.equal(0);

      await sports.withdraw(stmx.address);

      expect(await stmx.balanceOf(await OWNER.getAddress())).to.equal(wei("9999999.9999999999998001"));

      adminWithdrawables = await sports.getUserWithdrawables(await OWNER.getAddress());

      expect(adminWithdrawables.amounts).to.deep.equal([0, 0, 0]);

      await sports.createChallenges(
        [
          {
            token: ZERO_ADDR,
            amountFromWallet: "1000000000000000000",
            amountFromWithdrawables: 0,
            startTime: await time.latest(),
            endTime: (await time.latest()) + 100000000,
          },
        ],
        1,
        wei("5"),
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        wei("10"),
        [
          "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
          "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
        ],
        { value: "1000000000000000000" }
      );

      await sports.connect(BACK).changeChallengeTime(2, (await time.latest()) - 10000, (await time.latest()) - 5000);
      await sports.connect(BACK).resolveChallenge(2, [await OWNER.getAddress()], [wei(100)]);

      adminWithdrawables = await sports.getUserWithdrawables(await OWNER.getAddress());
      expect(adminWithdrawables.tokens).to.deep.equal([stmx.address, usdc.address, ZERO_ADDR]);
      expect(adminWithdrawables.amounts).to.deep.equal([0, 0, wei("0.99999750125")]);

      await sports.withdraw(ZERO_ADDR);
    });
  });

  describe("resolveChallenge()", () => {
    beforeEach("setup", async () => {
      await stmx.mint(await OWNER.getAddress(), wei("1"));
      await stmx.mint(await SECOND.getAddress(), wei("1"));

      await stmx.approve(sports.address, wei("1"));
      await stmx.connect(SECOND).approve(sports.address, wei("1"));
    });

    it("should not resolve challenge", async () => {
      await sports.createChallenges(
        [
          {
            token: stmx.address,
            amountFromWallet: wei("0.1"),
            amountFromWithdrawables: 0,
            startTime: await time.latest(),
            endTime: (await time.latest()) + 100000000,
          },
        ],
        1,
        wei("5"),
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        wei("10"),
        [
          "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
          "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
        ]
      );
      await sports
        .connect(SECOND)
        .joinChallenges(
          [{ challengeId: 1, amountFromWallet: wei("0.5"), amountFromWithdrawables: 0 }],
          2,
          wei("10"),
          "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
          wei("12.5"),
          [
            "0x5439b40306349ef74da5b40456de24b827d571d6c6b9638b5bf6561b20e6195b",
            "0xe34752b3b1bd6af1fe28b37a680fefb2aea11d2f1954debe15ba6953cb595dc7",
          ]
        );

      await expect(sports.connect(BACK).resolveChallenge(2, [ZERO_ADDR], [wei(20)]))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(38);

      await expect(sports.connect(BACK).resolveChallenge(1, [await SECOND.getAddress()], [wei(20)]))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(39);

      await sports.connect(BACK).changeChallengeTime(1, (await time.latest()) - 10000, (await time.latest()) - 5000);

      await expect(
        sports
          .connect(BACK)
          .resolveChallenge(1, [await SECOND.getAddress(), await SECOND.getAddress()], [wei(20), wei(1.5)])
      )
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(16);

      await expect(
        sports
          .connect(BACK)
          .resolveChallenge(
            1,
            [
              await SECOND.getAddress(),
              await SECOND.getAddress(),
              await SECOND.getAddress(),
              await SECOND.getAddress(),
              await SECOND.getAddress(),
              await SECOND.getAddress(),
              await SECOND.getAddress(),
              await SECOND.getAddress(),
              await SECOND.getAddress(),
              await SECOND.getAddress(),
              await SECOND.getAddress(),
            ],
            [wei(20), wei(20), wei(20), wei(20), wei(20), wei(20), wei(20), wei(20), wei(20), wei(20), wei(20)]
          )
      )
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(14);
      await expect(
        sports.connect(BACK).resolveChallenge(1, [await SECOND.getAddress(), await BACK.getAddress()], [wei(20)])
      )
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(14);
      await expect(sports.connect(BACK).resolveChallenge(1, [await BACK.getAddress()], [wei(20)]))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(15);

      await expect(sports.connect(BACK).resolveChallenge(1, [await SECOND.getAddress()], [wei(20)]))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(17);

      await sports.createChallenges(
        [
          {
            token: stmx.address,
            amountFromWallet: wei("0.1"),
            amountFromWithdrawables: 0,
            startTime: await time.latest(),
            endTime: (await time.latest()) + 100000000,
          },
        ],
        1,
        wei("5"),
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        wei("10"),
        [
          "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
          "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
        ]
      );
      await sports
        .connect(SECOND)
        .joinChallenges(
          [{ challengeId: 2, amountFromWallet: wei("0.5"), amountFromWithdrawables: 0 }],
          2,
          wei("10"),
          "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
          wei("12.5"),
          [
            "0x5439b40306349ef74da5b40456de24b827d571d6c6b9638b5bf6561b20e6195b",
            "0xe34752b3b1bd6af1fe28b37a680fefb2aea11d2f1954debe15ba6953cb595dc7",
          ]
        );

      await sports.connect(BACK).changeChallengeTime(2, (await time.latest()) - 10000, (await time.latest()) - 5000);

      await expect(sports.connect(BACK).resolveChallenge(2, [ZERO_ADDR], [wei(20)]))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(15);
    });

    it("should resolve challenge", async () => {
      await sports.createChallenges(
        [
          {
            token: stmx.address,
            amountFromWallet: wei("1"),
            amountFromWithdrawables: 0,
            startTime: await time.latest(),
            endTime: (await time.latest()) + 100000000,
          },
        ],
        1,
        wei("5"),
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        wei("10"),
        [
          "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
          "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
        ]
      );
      await sports
        .connect(SECOND)
        .joinChallenges(
          [{ challengeId: 1, amountFromWallet: wei("1"), amountFromWithdrawables: 0 }],
          2,
          wei("10"),
          "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
          wei("12.5"),
          [
            "0x5439b40306349ef74da5b40456de24b827d571d6c6b9638b5bf6561b20e6195b",
            "0xe34752b3b1bd6af1fe28b37a680fefb2aea11d2f1954debe15ba6953cb595dc7",
          ]
        );

      await sports.connect(BACK).changeChallengeTime(1, (await time.latest()) - 10000, (await time.latest()) - 5000);

      await sports
        .connect(BACK)
        .connect(BACK)
        .resolveChallenge(1, [await SECOND.getAddress()], [wei(100)]);

      const detail = await sports.getChallengeDetails(1);
      expect(detail.amount).to.be.equal(wei("2"));

      const withdrawables = await sports.getUserWithdrawables(await SECOND.getAddress());

      expect(withdrawables.tokens).to.deep.equal([stmx.address, usdc.address, ZERO_ADDR]);
      expect(withdrawables.amounts).to.deep.equal([wei("2"), 0, 0]);
    });
  });

  describe("cancelChallenge()", () => {
    beforeEach("setup", async () => {
      await stmx.mint(await OWNER.getAddress(), wei("1"));
      await stmx.mint(await SECOND.getAddress(), wei("1"));
      await stmx.mint(await THIRD.getAddress(), wei("1"));

      await stmx.approve(sports.address, wei("1"));
      await stmx.connect(SECOND).approve(sports.address, wei("1"));
      await stmx.connect(THIRD).approve(sports.address, wei("1"));
    });

    it("should not cancel challenge", async () => {
      await sports.createChallenges(
        [
          {
            token: stmx.address,
            amountFromWallet: wei("0.1"),
            amountFromWithdrawables: 0,
            startTime: await time.latest(),
            endTime: (await time.latest()) + 100000000,
          },
        ],
        1,
        wei("5"),
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        wei("10"),
        [
          "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
          "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
        ]
      );
      await sports
        .connect(SECOND)
        .joinChallenges(
          [{ challengeId: 1, amountFromWallet: wei("0.5"), amountFromWithdrawables: 0 }],
          2,
          wei("10"),
          "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
          wei("12.5"),
          [
            "0x5439b40306349ef74da5b40456de24b827d571d6c6b9638b5bf6561b20e6195b",
            "0xe34752b3b1bd6af1fe28b37a680fefb2aea11d2f1954debe15ba6953cb595dc7",
          ]
        );

      await expect(sports.connect(BACK).cancelChallenge(1234, 0))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(38);

      await sports.connect(BACK).cancelChallenge(1, 0);
      await expect(sports.connect(BACK).cancelChallenge(1, 0))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(40);

      await sports.createChallenges(
        [
          {
            token: stmx.address,
            amountFromWallet: wei("0.1"),
            amountFromWithdrawables: 0,
            startTime: await time.latest(),
            endTime: (await time.latest()) + 100000000,
          },
        ],
        1,
        wei("5"),
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        wei("10"),
        [
          "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
          "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
        ]
      );

      await expect(sports.connect(OWNER).cancelChallenge(2, 0))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(18);
    });

    it("should correctly CANCEL awaiting challenge", async () => {
      await sports.createChallenges(
        [
          {
            token: stmx.address,
            amountFromWallet: wei("0.1"),
            amountFromWithdrawables: 0,
            startTime: await time.latest(),
            endTime: (await time.latest()) + 100000000,
          },
        ],
        1,
        wei("5"),
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        wei("10"),
        [
          "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
          "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
        ]
      );
      await sports
        .connect(SECOND)
        .joinChallenges(
          [{ challengeId: 1, amountFromWallet: wei("0.5"), amountFromWithdrawables: 0 }],
          2,
          wei("10"),
          "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
          wei("12.5"),
          [
            "0x5439b40306349ef74da5b40456de24b827d571d6c6b9638b5bf6561b20e6195b",
            "0xe34752b3b1bd6af1fe28b37a680fefb2aea11d2f1954debe15ba6953cb595dc7",
          ]
        );

      await sports.connect(BACK).cancelChallenge(1, 0);

      let details = await sports.getChallengeDetails(1);

      expect(details.status).to.equal(ChallengeStatus.Canceled);

      let withdrawables = await sports.getUserWithdrawables(await OWNER.getAddress());

      expect(withdrawables.tokens).to.deep.equal([stmx.address, usdc.address, ZERO_ADDR]);
      expect(withdrawables.amounts).to.deep.equal([wei("0.1"), 0, 0]);

      withdrawables = await sports.getUserWithdrawables(await SECOND.getAddress());

      expect(withdrawables.tokens).to.deep.equal([stmx.address, usdc.address, ZERO_ADDR]);
      expect(withdrawables.amounts).to.deep.equal([wei("0.5"), 0, 0]);

      // for long awaiting
      await sports.connect(SECOND).createChallenges(
        [
          {
            token: stmx.address,
            amountFromWallet: wei("0.1"),
            amountFromWithdrawables: 0,
            startTime: await time.latest(),
            endTime: (await time.latest()) + 1000,
          },
        ],
        2,
        wei("10"),
        "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        wei("12.5"),
        [
          "0x7d0cf3a59f8740f42727f7f35163b5249e1796a487af22d7d9d00b55af56d29c",
          "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
        ]
      );
      await sports
        .connect(THIRD)
        .joinChallenges(
          [{ challengeId: 2, amountFromWallet: wei("0.5"), amountFromWithdrawables: 0 }],
          3,
          wei(15),
          "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
          wei(15),
          [
            "0x13df005962591b1eed93bcf49c3d3df77da11cf9f0a68a8139a7253905af4bb9",
            "0x7d0cf3a59f8740f42727f7f35163b5249e1796a487af22d7d9d00b55af56d29c",
            "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
          ]
        );

      await time.increase(Number(details.endTime) + 172800);

      await sports.connect(OWNER).cancelChallenge(2, 1);
    });

    it("should correctly CANCEL betting challenge", async () => {
      await sports.createChallenges(
        [
          {
            token: stmx.address,
            amountFromWallet: wei("0.1"),
            amountFromWithdrawables: 0,
            startTime: await time.latest(),
            endTime: (await time.latest()) + 100000000,
          },
        ],
        1,
        wei("5"),
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        wei("10"),
        [
          "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
          "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
        ]
      );
      await sports
        .connect(SECOND)
        .joinChallenges(
          [{ challengeId: 1, amountFromWallet: wei("0.5"), amountFromWithdrawables: 0 }],
          2,
          wei("10"),
          "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
          wei("12.5"),
          [
            "0x5439b40306349ef74da5b40456de24b827d571d6c6b9638b5bf6561b20e6195b",
            "0xe34752b3b1bd6af1fe28b37a680fefb2aea11d2f1954debe15ba6953cb595dc7",
          ]
        );

      await sports.connect(BACK).cancelChallenge(1, 0);

      const details = await sports.getChallengeDetails(1);

      expect(details.status).to.equal(ChallengeStatus.Canceled);

      let withdrawables = await sports.getUserWithdrawables(await OWNER.getAddress());

      expect(withdrawables.tokens).to.deep.equal([stmx.address, usdc.address, ZERO_ADDR]);
      expect(withdrawables.amounts).to.deep.equal([wei("0.1"), 0, 0]);

      withdrawables = await sports.getUserWithdrawables(await SECOND.getAddress());

      expect(withdrawables.tokens).to.deep.equal([stmx.address, usdc.address, ZERO_ADDR]);
      expect(withdrawables.amounts).to.deep.equal([wei("0.5"), 0, 0]);
    });
  });

  describe("increaseBetAmount()", () => {
    beforeEach("setup", async () => {
      await stmx.mint(await OWNER.getAddress(), wei("1"));
      await stmx.mint(await SECOND.getAddress(), wei("1"));
      await stmx.mint(await THIRD.getAddress(), wei("1"));

      await stmx.approve(sports.address, wei("1"));
      await stmx.connect(SECOND).approve(sports.address, wei("1"));
      await stmx.connect(THIRD).approve(sports.address, wei("1"));
    });

    it("should not increase bet amount", async () => {
      await sports.allowBetting(true);
      await expect(
        sports
          .connect(SECOND)
          .increaseBetAmount(
            1,
            wei("0.1"),
            0,
            2,
            wei("10"),
            "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
            wei("12.5"),
            [
              "0x7d0cf3a59f8740f42727f7f35163b5249e1796a487af22d7d9d00b55af56d29c",
              "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
            ]
          )
      )
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(38);

      await sports.connect(SECOND).createChallenges(
        [
          {
            token: stmx.address,
            amountFromWallet: wei("0.1"),
            amountFromWithdrawables: 0,
            startTime: await time.latest(),
            endTime: (await time.latest()) + 100000000,
          },
        ],
        2,
        wei("10"),
        "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        wei("12.5"),
        [
          "0x7d0cf3a59f8740f42727f7f35163b5249e1796a487af22d7d9d00b55af56d29c",
          "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
        ]
      );

      await expect(
        sports
          .connect(THIRD)
          .increaseBetAmount(1, wei("0.1"), 0, 3, wei(15), "0x90F79bf6EB2c4f870365E785982E1f101E93b906", wei(15), [
            "0x13df005962591b1eed93bcf49c3d3df77da11cf9f0a68a8139a7253905af4bb9",
            "0x068ed87f896a485fe3bfe5a7b934f4b3ba5dd4f6f3aeafc2440f349b4f0b12f4",
          ])
      )
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(7);

      await expect(
        sports
          .connect(SECOND)
          .increaseBetAmount(
            1,
            wei("0.1"),
            0,
            2,
            wei("10"),
            "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
            wei("12.5"),
            [
              "0x7d0cf3a59f8740f42727f7f35163b5249e1796a487af22d7d9d00b55af56d29c",
              "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
            ],
            { value: wei("0.1") }
          )
      )
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(34);

      await sports.connect(SECOND).createChallenges(
        [
          {
            token: ZERO_ADDR,
            amountFromWallet: wei("0.1"),
            amountFromWithdrawables: 0,
            startTime: await time.latest(),
            endTime: (await time.latest()) + 100000000,
          },
        ],
        2,
        wei("10"),
        "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        wei("12.5"),
        [
          "0x7d0cf3a59f8740f42727f7f35163b5249e1796a487af22d7d9d00b55af56d29c",
          "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
        ],
        {
          value: wei("0.1"),
        }
      );

      await expect(
        sports
          .connect(SECOND)
          .increaseBetAmount(
            2,
            wei("0.1"),
            0,
            2,
            wei("10"),
            "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
            wei("12.5"),
            [
              "0x7d0cf3a59f8740f42727f7f35163b5249e1796a487af22d7d9d00b55af56d29c",
              "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
            ],
            {
              value: wei("0.2"),
            }
          )
      )
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(33);

      await sports.connect(BACK).changeChallengeTime(1, (await time.latest()) - 10000, (await time.latest()) - 5000);

      await expect(
        sports
          .connect(SECOND)
          .increaseBetAmount(
            1,
            wei("0.1"),
            0,
            2,
            wei("10"),
            "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
            wei("12.5"),
            [
              "0x7d0cf3a59f8740f42727f7f35163b5249e1796a487af22d7d9d00b55af56d29c",
              "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
            ]
          )
      )
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(32);

      await sports.allowBetting(false);
      expect(await sports.bettingAllowed()).to.equal(false);
      await expect(
        sports
          .connect(SECOND)
          .increaseBetAmount(
            1,
            wei("0.1"),
            0,
            2,
            wei("10"),
            "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
            wei("12.5"),
            [
              "0x7d0cf3a59f8740f42727f7f35163b5249e1796a487af22d7d9d00b55af56d29c",
              "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
            ]
          )
      )
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(31);
    });
    it("should increase the bet amount", async () => {
      await sports.connect(OWNER).updateApplyMembershipValues(true);

      await sports.connect(SECOND).createChallenges(
        [
          {
            token: ZERO_ADDR,
            amountFromWallet: wei("0.1"),
            amountFromWithdrawables: 0,
            startTime: await time.latest(),
            endTime: (await time.latest()) + 100000000,
          },
        ],
        2,
        wei("10"),
        "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        wei("12.5"),
        [
          "0x5439b40306349ef74da5b40456de24b827d571d6c6b9638b5bf6561b20e6195b",
          "0xe34752b3b1bd6af1fe28b37a680fefb2aea11d2f1954debe15ba6953cb595dc7",
        ],
        {
          value: wei("0.1"),
        }
      );

      await sports
        .connect(SECOND)
        .increaseBetAmount(
          1,
          wei("0.1"),
          0,
          2,
          wei("10"),
          "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
          wei("12.5"),
          [
            "0x5439b40306349ef74da5b40456de24b827d571d6c6b9638b5bf6561b20e6195b",
            "0xe34752b3b1bd6af1fe28b37a680fefb2aea11d2f1954debe15ba6953cb595dc7",
          ],
          {
            value: wei("0.1"),
          }
        );

      let details = await sports.getChallengeDetails(1);
      expect(details.amount).to.equal(wei("0.2"));
    });
  });

  describe("cancelParticipation()", () => {
    beforeEach("setup", async () => {
      await stmx.mint(await OWNER.getAddress(), wei("2"));
      await stmx.mint(await SECOND.getAddress(), wei("3"));
      await stmx.mint(await THIRD.getAddress(), wei("1"));

      await stmx.approve(sports.address, wei("3"));
      await stmx.connect(SECOND).approve(sports.address, wei("3"));

      await stmx.approve(sports.address, wei("1"));
      await stmx.connect(THIRD).approve(sports.address, wei("1"));
    });

    it("should not cancel participation", async () => {
      await sports.createChallenges(
        [
          {
            token: stmx.address,
            amountFromWallet: wei("0.1"),
            amountFromWithdrawables: 0,
            startTime: await time.latest(),
            endTime: (await time.latest()) + 100000000,
          },
        ],
        1,
        wei("5"),
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        wei("10"),
        [
          "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
          "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
        ]
      );
      await sports
        .connect(SECOND)
        .joinChallenges(
          [{ challengeId: 1, amountFromWallet: wei("0.5"), amountFromWithdrawables: 0 }],
          2,
          wei("10"),
          "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
          wei("12.5"),
          [
            "0x5439b40306349ef74da5b40456de24b827d571d6c6b9638b5bf6561b20e6195b",
            "0xe34752b3b1bd6af1fe28b37a680fefb2aea11d2f1954debe15ba6953cb595dc7",
          ]
        );

      await expect(sports.connect(BACK).cancelParticipation(SECOND.getAddress(), 2, 1))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(38);

      // challenge status - Canceled
      await sports.createChallenges(
        [
          {
            token: stmx.address,
            amountFromWallet: wei("0.1"),
            amountFromWithdrawables: 0,
            startTime: await time.latest(),
            endTime: (await time.latest()) + 100000000,
          },
        ],
        1,
        wei("5"),
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        wei("10"),
        [
          "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
          "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
        ]
      );
      await sports
        .connect(SECOND)
        .joinChallenges(
          [{ challengeId: 2, amountFromWallet: wei("0.5"), amountFromWithdrawables: 0 }],
          2,
          wei("10"),
          "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
          wei("12.5"),
          [
            "0x5439b40306349ef74da5b40456de24b827d571d6c6b9638b5bf6561b20e6195b",
            "0xe34752b3b1bd6af1fe28b37a680fefb2aea11d2f1954debe15ba6953cb595dc7",
          ]
        );

      await sports.connect(BACK).changeChallengeTime(2, (await time.latest()) - 10000, (await time.latest()) - 5000);
      await expect(sports.connect(BACK).cancelParticipation(THIRD.getAddress(), 2, 1))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(12);
      await sports.connect(BACK).cancelChallenge(2, 0);
      await expect(sports.connect(BACK).cancelParticipation(SECOND.getAddress(), 2, 1))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(40);

      // challenge status - Resolved
      await sports.createChallenges(
        [
          {
            token: stmx.address,
            amountFromWallet: wei("0.1"),
            amountFromWithdrawables: 0,
            startTime: await time.latest(),
            endTime: (await time.latest()) + 100000000,
          },
        ],
        1,
        wei("5"),
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        wei("10"),
        [
          "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
          "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
        ]
      );
      await sports
        .connect(SECOND)
        .joinChallenges(
          [{ challengeId: 3, amountFromWallet: wei("0.5"), amountFromWithdrawables: 0 }],
          2,
          wei("10"),
          "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
          wei("12.5"),
          [
            "0x5439b40306349ef74da5b40456de24b827d571d6c6b9638b5bf6561b20e6195b",
            "0xe34752b3b1bd6af1fe28b37a680fefb2aea11d2f1954debe15ba6953cb595dc7",
          ]
        );
      await sports.connect(BACK).changeChallengeTime(3, (await time.latest()) - 10000, (await time.latest()) - 5000);
      await sports.connect(BACK).resolveChallenge(3, [await OWNER.getAddress()], [wei(100)]);

      await expect(sports.connect(BACK).cancelParticipation(SECOND.getAddress(), 3, 1))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(40);
    });

    it("should cancel participation, when user participate in favour when cancel type is 1", async () => {
      await sports.connect(OWNER).createChallenges(
        [
          {
            token: stmx.address,
            amountFromWallet: wei("0.1"),
            amountFromWithdrawables: 0,
            startTime: await time.latest(),
            endTime: (await time.latest()) + 100000000,
          },
        ],
        1,
        wei("5"),
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        wei("10"),
        [
          "0x4e232da8604bb729b93c6612f6cba9ad2d3bf6acc807ecbf7e3457ac566c1223",
          "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
        ]
      );
      await sports
        .connect(THIRD)
        .joinChallenges(
          [{ challengeId: 1, amountFromWallet: wei("0.5"), amountFromWithdrawables: 0 }],
          3,
          wei(15),
          "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
          wei(15),
          [
            "0x13df005962591b1eed93bcf49c3d3df77da11cf9f0a68a8139a7253905af4bb9",
            "0x7d0cf3a59f8740f42727f7f35163b5249e1796a487af22d7d9d00b55af56d29c",
            "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
          ]
        );

      await sports.connect(BACK).changeChallengeTime(1, (await time.latest()) - 10000, (await time.latest()) - 5000);
      const detailsBeforeCancelletion = await sports.getChallengeDetails(1);

      await sports.connect(BACK).cancelParticipation(await THIRD.getAddress(), 1, 1);

      let withdrawables = await sports.getUserWithdrawables(await OWNER.getAddress());

      expect(withdrawables.tokens).to.deep.equal([stmx.address, usdc.address, ZERO_ADDR]);
      expect(withdrawables.amounts).to.deep.equal([0, 0, 0]);

      withdrawables = await sports.getUserWithdrawables(await SECOND.getAddress());

      expect(withdrawables.tokens).to.deep.equal([stmx.address, usdc.address, ZERO_ADDR]);
      expect(withdrawables.amounts).to.deep.equal([0, 0, 0]);

      withdrawables = await sports.getUserWithdrawables(await THIRD.getAddress());

      expect(withdrawables.tokens).to.deep.equal([stmx.address, usdc.address, ZERO_ADDR]);
      expect(withdrawables.amounts).to.deep.equal([wei("0.5"), 0, 0]);

      const detailsAfterCancellation = await sports.getChallengeDetails(1);

      expect(detailsAfterCancellation.amount).to.equal(detailsBeforeCancelletion.amount.sub(wei("0.5")));

      expect(detailsAfterCancellation.users[0]).to.equal(await OWNER.getAddress());

      const betDetails = await sports.getUserBet(1, THIRD.getAddress());
      expect(betDetails.amount).to.equal(0);

      await sports.connect(BACK).resolveChallenge(1, [await OWNER.getAddress()], [wei(100)]);
    });

    it("should cancel participation, when user participate in favour when cancel type is not 1", async () => {
      await sports.connect(OWNER).createChallenges(
        [
          {
            token: stmx.address,
            amountFromWallet: wei("0.1"),
            amountFromWithdrawables: 0,
            startTime: await time.latest(),
            endTime: (await time.latest()) + 100000000,
          },
        ],
        1,
        wei("5"),
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        wei("10"),
        [
          "0x4e232da8604bb729b93c6612f6cba9ad2d3bf6acc807ecbf7e3457ac566c1223",
          "0x189fe753b4394dc529795c33cdb3bf155cd683b2874524f876b911dd019c897c",
        ]
      );
      await sports
        .connect(SECOND)
        .joinChallenges(
          [{ challengeId: 1, amountFromWallet: wei("0.5"), amountFromWithdrawables: 0 }],
          2,
          wei("10"),
          "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
          wei("12.5"),
          [
            "0x5439b40306349ef74da5b40456de24b827d571d6c6b9638b5bf6561b20e6195b",
            "0xe34752b3b1bd6af1fe28b37a680fefb2aea11d2f1954debe15ba6953cb595dc7",
          ]
        );
      await sports
        .connect(THIRD)
        .joinChallenges(
          [{ challengeId: 1, amountFromWallet: wei("0.5"), amountFromWithdrawables: 0 }],
          3,
          wei(15),
          "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
          wei(15),
          [
            "0x13df005962591b1eed93bcf49c3d3df77da11cf9f0a68a8139a7253905af4bb9",
            "0x7d0cf3a59f8740f42727f7f35163b5249e1796a487af22d7d9d00b55af56d29c",
            "0x2c2445e7c3509d2148959d3a8c2e7023b4858c099617b5d55cb1b7ae5c0be0b6",
          ]
        );

      await sports.connect(BACK).changeChallengeTime(1, (await time.latest()) - 10000, (await time.latest()) - 5000);
      const detailsBeforeCancelletion = await sports.getChallengeDetails(1);

      await sports.connect(BACK).cancelParticipation(await THIRD.getAddress(), 1, 2);

      let withdrawables = await sports.getUserWithdrawables(await OWNER.getAddress());

      expect(withdrawables.tokens).to.deep.equal([stmx.address, usdc.address, ZERO_ADDR]);
      expect(withdrawables.amounts).to.deep.equal([0, 0, 0]);

      withdrawables = await sports.getUserWithdrawables(await SECOND.getAddress());

      expect(withdrawables.tokens).to.deep.equal([stmx.address, usdc.address, ZERO_ADDR]);
      expect(withdrawables.amounts).to.deep.equal([0, 0, 0]);

      withdrawables = await sports.getUserWithdrawables(await THIRD.getAddress());

      expect(withdrawables.tokens).to.deep.equal([stmx.address, usdc.address, ZERO_ADDR]);
      expect(withdrawables.amounts).to.deep.equal([wei("0.5"), 0, 0]);

      const detailsAfterCancellation = await sports.getChallengeDetails(1);

      expect(detailsAfterCancellation.amount).to.equal(detailsBeforeCancelletion.amount.sub(wei("0.5")));

      expect(detailsAfterCancellation.users[0]).to.equal(await OWNER.getAddress());

      const betDetails = await sports.getUserBet(1, THIRD.getAddress());
      expect(betDetails.amount).to.equal(0);
      await sports.connect(BACK).resolveChallenge(1, [await OWNER.getAddress()], [wei(100)]);
    });
  });

  describe("changeMinUSDBettingAmount()", () => {
    it("should not change minimum USD betting amount", async () => {
      await expect(sports.connect(OWNER).changeMinUSDBettingAmount(wei("9", 8)))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(28);
      await expect(sports.connect(OWNER).changeMinUSDBettingAmount(wei("1001", 8)))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(28);
    });

    it("should change minimum USD betting amount", async () => {
      await sports.connect(OWNER).changeMinUSDBettingAmount(wei("10", 8));
      expect(await sports.minUSDBetAmount()).to.deep.equal(wei("10", 8));
      await sports.connect(OWNER).changeMinUSDBettingAmount(wei("100", 8));
      expect(await sports.minUSDBetAmount()).to.deep.equal(wei("100", 8));
    });
  });

  describe("debitInSC()", () => {
    beforeEach("setup", async () => {
      await stmx.mint(await OWNER.getAddress(), wei("2"));

      await stmx.connect(OWNER).approve(sports.address, wei("2"));
    });
    it("should not debit in SC", async () => {
      await expect(sports.connect(OWNER).debitInSC(0, ZERO_ADDR))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(28);

      await expect(sports.connect(OWNER).debitInSC(1, ethOracle.address))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(3);

      await expect(sports.connect(OWNER).debitInSC(1, ZERO_ADDR, { value: wei("0.1") }))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(29);

      await expect(sports.connect(OWNER).debitInSC(1, usdc.address, { value: wei("0.1") }))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(34);
    });

    it("should debit in SC", async () => {
      await sports.connect(OWNER).debitInSC(wei("1"), ZERO_ADDR, { value: wei("1") });
      await sports.connect(OWNER).debitInSC(wei("0.1"), stmx.address);

      let withdrawables = await sports.connect(OWNER).getUserWithdrawables(await OWNER.getAddress());
      expect(withdrawables.amounts[2]).to.equal(wei("1"));
      expect(withdrawables.amounts[0]).to.equal(wei("0.1"));
    });
  });

  describe("updateRoot()", () => {
    it("should update the merkel root", async () => {
      expect(
        await sports.connect(BACK).updateRoot("0xd352eb8473d556192f5df0dc6a5351b4ff1466a57995cfa332a5246783eaff87")
      ).not.to.be.reverted;
    });
  });

  describe("updateMaxChallengers()", () => {
    it("should not update max challengers", async () => {
      await expect(sports.connect(OWNER).updateMaxChallengers(51))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(23);
      await expect(sports.connect(OWNER).updateMaxChallengers(0))
        .to.be.revertedWithCustomError(P2PSportsMock, "ErrorMessage")
        .withArgs(23);
    });
  });

  describe("renounceOwnership()", () => {
    it("should not renounce ownership", async () => {
      await expect(sports.connect(OWNER).renounceOwnership()).to.be.revertedWith("Renouncing ownership is disabled");
    });
  });
});

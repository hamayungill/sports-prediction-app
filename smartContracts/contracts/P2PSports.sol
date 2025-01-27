// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

import "@solarity/solidity-lib/libs/arrays/SetHelper.sol";
import "@solarity/solidity-lib/libs/arrays/ArrayHelper.sol";
import "@solarity/solidity-lib/libs/utils/TypeCaster.sol";
import "@solarity/solidity-lib/libs/decimals/DecimalsConverter.sol";

import "./interfaces/IP2PSports.sol";

import "@solarity/solidity-lib/utils/Globals.sol";

/// @title P2PSports: A Peer-to-Peer Sports Betting Smart Contract
/** @notice This contract allows users to create and join sports betting challenges, bet on outcomes,
 * and withdraw winnings in a decentralized manner. It supports betting with STMX token and other ERC20 tokens, along with ETH
 * and uses Chainlink for price feeds to calculate admin shares.
 * @dev The contract uses OpenZeppelin's Ownable and ReentrancyGuard for access control and reentrancy protection,
 * and utilizes libraries from solidity-lib for array and decimal manipulations.
 *
 * ERROR CODES: In order to reduce the size of the Smart Contract, we have defined the short codes instead of the complete
 * error messages in the revert/require statements. The messages corresponding to the error codes can be seen in the following document.
 * https://duelnow.notion.site/Smart-Contract-Error-Codes-ca7427520ce04ca293d3e21fb1e21583
 */
contract P2PSports is IP2PSports, Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.UintSet;
    using SetHelper for EnumerableSet.AddressSet;
    using DecimalsConverter for *;
    using ArrayHelper for uint256[];
    using TypeCaster for *;

    /// @notice merkle tree root node
    bytes32 private merkleRoot;

    /// @notice Backend server address to resolve, cancel challenges or some additional control.
    address public backend;
    /// @notice Token address for the STMX token, used as one of the betting currencies

    // Configuration / Validation parameters for different betting logics
    uint256 public maxChallengersPerChallenge;
    uint256 public minUSDBetAmount;
    bool public applyMembershipValues;

    /// @notice ChallengeId of the last challenge created
    uint256 public latestChallengeId;

    /// @notice Flag to allow or restrict creations or joining challenges
    bool public bettingAllowed;

    uint256 public constant MAX_ADMIN_SHARE_IN_USD = 1000 * 10 ** 8;
    uint256 public constant MAX_ADMIN_SHARE_STMX = 100000 * 10 ** 18;
    uint256 public constant MAX_FOR_MIN_USD_BET_AMOUNT = 100 * 10 ** 8;
    uint256 public constant MAX_WINNERS_PER_CHALLENGE = 10;
    uint256 public constant AWAITING_TIME_FOR_OWNER_CANCEL = 172800; //48 hours
    uint256 public constant DEFAULT_ORACLE_DECIMALS = 8;
    uint256 public constant MAX_ADMIN_SHARE_THRESHOLDS = 20;
    uint256 public constant PRICE_FEED_ERROR_MARGIN = 5;
    uint256 public constant MAX_CHALLENGES_TO_CREATE_JOIN = 10;

    // Internal storage for tokens, price feeds, challenges, and bets
    EnumerableSet.AddressSet internal _allTokens;
    EnumerableSet.AddressSet internal _oraclessTokens;
    EnumerableSet.AddressSet internal _allowedTokens;

    mapping(address => AggregatorV3Interface) internal _priceFeeds;
    mapping(uint256 => Challenge) internal _challenges;
    mapping(address => mapping(uint256 => UserBet)) internal _userChallengeBets;
    mapping(address => mapping(address => uint256)) internal _withdrawables;
    mapping(address => AdminShareRule) internal _adminShareRules;
    mapping(address => uint256) internal _oraclessTokensMinBetAmount;
    /// @dev Ensures the function is called only by the backend address
    modifier onlyBackend() {
        _onlyBackend();
        _;
    }

    /// @dev Ensures the function is called only by the backend address or owner address
    modifier onlyBackendOrOwner() {
        _onlyBackendOrOwner();
        _;
    }

    /// @notice Initializes the contract with provided addresses and tokens
    /** @dev Sets initial configuration for the contract and allows specified tokens.
     * @param backend_ Address of the backend server for challenge resolution and control
     */
    constructor(address backend_) {
        if (backend_ == address(0)) {
            revert ErrorMessage(1);
        }

        // Contract setup and initial token allowance
        backend = backend_;
        maxChallengersPerChallenge = 50;
        bettingAllowed = true;
        minUSDBetAmount = 10 * 10 ** 8;
    }

    receive() external payable {}

    /// @notice Creates multiple challenges for betting
    /**
     * @dev This function allows the creation of multiple challenges in a single transaction.
     *      It emits a `ChallengeCreated` event for each challenge and calls `joinChallenge` to register the
     *      creator's bet for each challenge.
     *
     * @param challenges An array of `ChallengeParams` containing all the necessary parameters for each challenge.
     *
     * Each element in the `challenges` array represents a separate challenge with the following parameters:
     * @param challenges[i].token Address of the token used for betting (zero address for native currency)
     * @param challenges[i].amountFromWallet Amount to be bet from the creator's wallet balance
     * @param challenges[i].amountFromWithdrawables Amount to be bet from the creator's withdrawable balance
     * @param challenges[i].startTime Start time of the challenge
     * @param challenges[i].endTime End time of the challenge
     * @param membershipLevel membership level of the user, which may affect eligibility and rewards
     * @param feePercentage percentage amount reduced from admin share
     * @param referrer referrer address
     * @param referralCommision referral will get the comission from admin share
     * @param proof leaf nood proof
     */
    function createChallenges(
        CreateChallengeParams[] memory challenges,
        uint8 membershipLevel,
        uint256 feePercentage,
        address referrer,
        uint256 referralCommision,
        bytes32[] memory proof
    ) external payable {
        uint256 challengeLength = challenges.length;

        if (challengeLength > MAX_CHALLENGES_TO_CREATE_JOIN) {
            revert ErrorMessage(9);
        }
        JoinChallengeParams[] memory joinChallengeParams = new JoinChallengeParams[](
            challengeLength
        );

        for (uint8 i = 0; i < challenges.length; i++) {
            CreateChallengeParams memory challengeParams = challenges[i];

            uint256 challengeId = ++latestChallengeId;

            if (
                challengeParams.startTime > block.timestamp ||
                challengeParams.endTime <= block.timestamp
            ) {
                revert ErrorMessage(2);
            }

            if (!_allowedTokens.contains(challengeParams.token)) {
                revert ErrorMessage(3);
            }

            Challenge storage _challenge = _challenges[challengeId];

            _challenge.token = challengeParams.token;
            _challenge.status = ChallengeStatus.Betting;
            _challenge.startTime = challengeParams.startTime;
            _challenge.endTime = challengeParams.endTime;

            emit ChallengeCreated(
                challengeId,
                challengeParams.token,
                msg.sender,
                challengeParams.amountFromWallet + challengeParams.amountFromWithdrawables
            );

            joinChallengeParams[i] = JoinChallengeParams({
                challengeId: challengeId,
                amountFromWallet: challengeParams.amountFromWallet,
                amountFromWithdrawables: challengeParams.amountFromWithdrawables
            });
        }

        joinChallenges(
            joinChallengeParams,
            membershipLevel,
            feePercentage,
            referrer,
            referralCommision,
            proof
        );
    }

    /// @notice Allows users to join multiple challenges or one challenge at a time.
    /**
     * @dev This function allows a user to join multiple challenges or one challenge at a time.
     *      Upon successful bet placement, a `ChallengeJoined` event is emitted.
     *
     * @param challenges A `JoinChallengeParams` struct containing all the parameters for the user's bet in the challenge.
     *
     * The `JoinChallengeParams` struct contains the following fields:
     * @param challenges.challengeId The unique ID of the challenge the user is joining.
     * @param challenges.amountFromWallet Amount to be bet from the user's wallet balance.
     * @param challenges.amountFromWithdrawables Amount to be bet from the user's withdrawable balance (e.g., tokens the user has already withdrawn).
     * @param membershipLevel user membership level
     * @param feePercentage percentage amount reduced from admin share
     * @param referrer referrer address
     * @param referralCommision referral will get the comission from admin share
     * @param proof leaf nood proof
     */
    function joinChallenges(
        JoinChallengeParams[] memory challenges,
        uint8 membershipLevel,
        uint256 feePercentage,
        address referrer,
        uint256 referralCommision,
        bytes32[] memory proof
    ) public payable {
        uint256 challengeLength = challenges.length;
        if (challengeLength > MAX_CHALLENGES_TO_CREATE_JOIN) {
            revert ErrorMessage(9);
        }
        for (uint8 i = 0; i < challenges.length; i++) {
            JoinChallengeParams memory challengeParams = challenges[i];

            _assertChallengeExistence(challengeParams.challengeId);

            if (_userChallengeBets[msg.sender][challengeParams.challengeId].amount != 0) {
                revert ErrorMessage(6);
            }

            _joinChallenge(
                challengeParams.challengeId,
                challengeParams.amountFromWallet,
                challengeParams.amountFromWithdrawables,
                membershipLevel,
                feePercentage,
                referrer,
                referralCommision,
                proof
            );
        }
    }

    /// @notice Allows users to increase the bet amount
    /** @dev Emits a `BetAmountIncreased` event if the join is successful.
     * @param challengeId ID of the challenge for which user wants to increase the bet amount
     * @param amountFromWallet Amount to be bet from the user's wallet
     * @param amountFromWithdrawables Amount to be bet from the user's withdrawable balance
     * @param membershipLevel user membership level
     * @param feePercentage percentage amount reduced from admin share
     * @param referrer referrer address
     * @param referralCommision referral will get the comission from admin share
     * @param proof leaf nood proof
     */
    function increaseBetAmount(
        uint256 challengeId,
        uint256 amountFromWallet,
        uint256 amountFromWithdrawables,
        uint8 membershipLevel,
        uint256 feePercentage,
        address referrer,
        uint256 referralCommision,
        bytes32[] memory proof
    ) public payable {
        _assertChallengeExistence(challengeId);
        UserBet storage betDetails = _userChallengeBets[msg.sender][challengeId];
        if (betDetails.amount == 0) {
            revert ErrorMessage(7);
        }

        Challenge storage challengeDetails = _challenges[challengeId];

        (
            uint256 amount,
            uint256 adminShare,
            uint256 referralCommisionAmount
        ) = _calculateChallengeAmounts(
                challengeDetails.token,
                amountFromWallet,
                amountFromWithdrawables,
                challengeId,
                membershipLevel,
                feePercentage,
                referrer,
                referralCommision,
                proof,
                false
            );

        betDetails.amount += amount;
        betDetails.adminShare += adminShare;
        betDetails.referralCommision += referralCommisionAmount;
        challengeDetails.amount += amount;

        emit BetAmountIncreased(
            challengeId,
            betDetails.amount,
            amount,
            msg.sender,
            challengeDetails.token
        );
    }

    /// @notice Checks if a challenge with the given ID exists
    /** @dev A challenge is considered to exist if its ID is greater than 0 and less than or equal to the latest challenge ID.
     * @param challengeId The ID of the challenge to check.
     * @return bool Returns true if the challenge exists, false otherwise.
     */
    function challengeExists(uint256 challengeId) public view returns (bool) {
        return challengeId > 0 && challengeId <= latestChallengeId;
    }

    /// @notice Owner can update the root node of merkle
    /** @dev This function will allow the owner to update the root node of merkle tree
     * @param _root root node of merkle tree
     */
    function updateRoot(bytes32 _root) public onlyBackend {
        merkleRoot = _root;
        emit MerkleRootUpdated(_root, msg.sender);
    }

    /// @notice Withdraws available tokens for the sender
    /** @dev This function allows users to withdraw their available tokens from the contract. It uses the
     * nonReentrant modifier from OpenZeppelin to prevent reentrancy attacks. A `UserWithdrawn` event is
     * emitted upon a successful withdrawal.
     * @param token The address of the token to be withdrawn. Use the zero address for the native currency.
     *
     * Requirements:
     * - The sender must have a positive withdrawable balance for the specified token.
     * Emits a {UserWithdrawn} event indicating the token, amount, and the user who performed the withdrawal.
     */
    function withdraw(address token) external nonReentrant {
        uint256 amount = _withdrawables[msg.sender][token];

        if (amount <= 0) {
            revert ErrorMessage(8);
        }

        delete _withdrawables[msg.sender][token];
        _withdraw(token, msg.sender, amount);

        emit UserWithdrawn(token, amount, msg.sender);
    }

    /// @notice Cancels a user's participation in a challenge
    /** @dev This function allows the backend to cancel a user's participation in a challenge, refunding their bet.
     * It can only be called by the backend and is protected against reentrancy attacks. The function checks if the
     * challenge exists and ensures that the challenge is either in the `Awaiting` or `Betting` status, implying that
     * it has not been resolved yet. Additionally, it verifies that the user has indeed placed a bet on the challenge.
     * After these checks, it calls an internal function `_cancelParticipation` to handle the logic for cancelling the
     * user's participation and processing the refund.
     * @param user The address of the user whose participation is to be cancelled.
     * @param challengeId The ID of the challenge from which the user's participation is to be cancelled.
     *
     * Requirements:
     * - The challenge must exist and be in a state where participation can be cancelled (`Awaiting` or `Betting`).
     * - The user must have participated in the challenge.
     * Uses the `onlyBackend` modifier to ensure only the backend can invoke this function, and `nonReentrant` for security.
     */
    function cancelParticipation(
        address user,
        uint256 challengeId,
        uint8 cancelType
    ) external onlyBackend nonReentrant {
        _assertChallengeExistence(challengeId);
        _assertCancelableStatus(challengeId);
        if (_userChallengeBets[user][challengeId].amount == 0) {
            revert ErrorMessage(12);
        }
        _cancelParticipation(user, challengeId, cancelType);
    }

    /// @notice Resolves challenge by determining winners and distributing profits
    /**
     * @dev This function is used for resolving challenges, where multiple participants can win.
     * It can only be executed by the backend and is protected against reentrancy. The function ensures that:
     * - The challenge exists, is currently awaiting resolution
     * that the lengths of the winners and profits arrays match and do not exceed the maximum number of winners allowed.
     * Each winner's address must have participated in the challenge, and winners must be unique. The total of the profits
     * percentages must equal 100. Once validated, the challenge status is updated, and profits are calculated and
     * distributed to the winners based on the provided profits percentages.
     *
     * Once validated, the challenge status is updated, and profits are calculated and distributed to the winners based on
     * the specified percentages in `profits`.
     *
     * @param challengeId The ID of the group challenge to resolve.
     * @param winners An array of addresses of the winners of the challenge.
     * @param profits An array of profit percentages corresponding to each winner, summing to 100.
     *
     * Requirements:
     * - Each challenge must exist, be in the `Awaiting` status, and be of the `Group` type.
     * - The `winners` and `profits` arrays within each `ResolveChallengeParams` must have matching lengths and must
     *   respect the maximum number of winners allowed.
     * - The sum of the `profits` percentages must equal 100 for each challenge.
     *
     * Emits a {ChallengeResolved} event for each resolved challenge with the challenge ID and an outcome of `5`,
     * indicating group challenge resolution.
     */
    function resolveChallenge(
        uint256 challengeId,
        address[] calldata winners,
        uint256[] calldata profits
    ) external onlyBackend nonReentrant {
        _assertChallengeExistence(challengeId);
        _assertResolveableStatus(challengeId);
        Challenge storage challengeDetails = _challenges[challengeId];
        uint256 winnersLength = winners.length;
        if (winnersLength != profits.length || winnersLength > MAX_WINNERS_PER_CHALLENGE) {
            revert ErrorMessage(14);
        }

        uint256 totalProfit = 0;
        for (uint256 i = 0; i < winnersLength; ++i) {
            totalProfit += profits[i];
            if (i > 0) {
                if (winners[i] <= winners[i - 1]) {
                    revert ErrorMessage(16);
                }
            }
            if (_userChallengeBets[winners[i]][challengeId].amount == 0) {
                revert ErrorMessage(15);
            }
        }

        if (totalProfit != (100 * DECIMAL)) {
            revert ErrorMessage(17);
        }

        challengeDetails.status = ChallengeStatus.Resolved;

        emit ChallengeResolved(challengeId, 5);

        _calculateChallenge(challengeId, winners, profits);
    }

    /// @notice Cancels a challenge and refunds all participants
    /** @dev This function allows the backend to cancel a challenge if it's either awaiting resolution or still open for betting.
     * It ensures that the challenge exists and is in a cancelable state (either `Awaiting` or `Betting`). Upon cancellation,
     * the challenge's status is updated to `Canceled`, and all bets placed on the challenge are refunded to the participants.
     * This function is protected by the `onlyBackend` modifier to restrict access to the backend address, and `nonReentrant`
     * to prevent reentrancy attacks.
     * @param challengeId The ID of the challenge to be cancelled.
     * @param cancelType 0-Return bet amount without admin shares 1-Return bet amount with admin shares.
     *
     * Requirements:
     * - The challenge must exist and be in a state that allows cancellation (`Awaiting` or `Betting`).
     * Emits a {ChallengeCanceled} event upon successful cancellation, indicating which challenge was cancelled.
     */
    function cancelChallenge(
        uint256 challengeId,
        uint8 cancelType
    ) external onlyBackendOrOwner nonReentrant {
        _assertChallengeExistence(challengeId);
        _assertCancelableStatus(challengeId);
        Challenge storage challengeDetails = _challenges[challengeId];

        if (
            msg.sender == owner() &&
            (challengeDetails.endTime + AWAITING_TIME_FOR_OWNER_CANCEL) >= block.timestamp
        ) {
            revert ErrorMessage(18);
        }

        challengeDetails.status = ChallengeStatus.Canceled;

        emit ChallengeCanceled(challengeId);

        _cancelBets(challengeId, cancelType);
    }

    /// @notice Toggles the ability for users to place bets on challenges
    /** @dev This function allows the contract owner to enable or disable betting across the platform.
     * It's a straightforward toggle that sets the `bettingAllowed` state variable based on the input.
     * Access to this function is restricted to the contract owner through the `onlyOwner` modifier from
     * OpenZeppelin's Ownable contract, ensuring that only the owner can change the betting policy.
     * @param value_ A boolean indicating whether betting should be allowed (`true`) or not (`false`).
     */
    function allowBetting(bool value_) external onlyOwner {
        bettingAllowed = value_;
        emit BettingAllowed(value_, msg.sender);
    }

    /// @notice Toggles the ability for membership discount and referral comisions
    /** @dev This function will allow the owner to toggle the apply membership values
     * @param value_ true to apply membership values and false for disable membership values
     */
    function updateApplyMembershipValues(bool value_) external onlyOwner {
        applyMembershipValues = value_;
        emit MembershipApplied(value_, msg.sender);
    }

    /// @notice Updates the minimum USD betting amount.
    /// @dev Can only be called by the contract owner.
    /// @param value_ The new minimum betting amount in USD.
    function changeMinUSDBettingAmount(uint256 value_) external onlyOwner {
        if (value_ < minUSDBetAmount || value_ > MAX_FOR_MIN_USD_BET_AMOUNT) {
            revert ErrorMessage(28);
        }
        minUSDBetAmount = value_;
        emit MinUSDBettingAmountUpdated(value_, msg.sender);
    }

    /// @notice Updates the address of the backend responsible for challenge resolutions and administrative actions
    /** @dev This function allows the contract owner to change the backend address to a new one.
     * Ensures the new backend address is not the zero address to prevent rendering the contract unusable.
     * The function is protected by the `onlyOwner` modifier, ensuring that only the contract owner has the authority
     * to update the backend address. This is crucial for maintaining the integrity and security of the contract's
     * administrative functions.
     * @param backend_ The new address to be set as the backend. It must be a non-zero address.
     *
     * Requirements:
     * - The new backend address cannot be the zero address, ensuring that the function call has meaningful intent.
     */
    function changeBackend(address backend_) external onlyOwner {
        if (backend_ == address(0)) {
            revert ErrorMessage(1);
        }
        backend = backend_;
        emit BackendChanged(backend_, msg.sender);
    }

    /// @notice Allows a batch of tokens to be used for betting, with optional price feeds for valuation
    /** @dev This function permits the contract owner to add tokens to the list of those allowed for betting.
     * It also associates Chainlink price feeds with tokens, enabling the conversion of bets to a common value basis for calculations.
     * Tokens without a specified price feed (address(0)) are considered to have fixed or known values and are added to a separate list.
     * The function ensures that each token in the input array has a corresponding price feed address (which can be the zero address).
     * The `onlyOwner` modifier restricts this function's execution to the contract's owner, safeguarding against unauthorized token addition.
     * @param tokens An array of token addresses to be allowed for betting.
     * @param priceFeeds An array of Chainlink price feed addresses corresponding to the tokens. Use address(0) for tokens without a need for price feeds.
     * @param minBetAmounts An array of amount corresponding to every token being allowed, the value for oracless tokens will be considers only in this method.
     * Requirements:
     * - The lengths of the `tokens` and `priceFeeds` arrays must match to ensure each token has a corresponding price feed address.
     */
    function allowTokens(
        address[] memory tokens,
        address[] memory priceFeeds,
        uint256[] memory minBetAmounts
    ) public onlyOwner {
        uint256 tokensLength = tokens.length;
        uint256 priceFeedLength = priceFeeds.length;
        uint256 minBetAmountsLength = minBetAmounts.length;

        if (tokensLength != priceFeedLength || tokensLength != minBetAmountsLength) {
            revert ErrorMessage(9);
        }

        for (uint256 i = 0; i < tokensLength; ++i) {
            if (_allowedTokens.contains(tokens[i])) {
                revert ErrorMessage(46);
            }

            if (priceFeeds[i] == address(0)) {
                if (minBetAmounts[i] <= 0) {
                    revert ErrorMessage(20);
                }
                _oraclessTokensMinBetAmount[tokens[i]] = minBetAmounts[i];
                _oraclessTokens.add(tokens[i]);
            } else {
                isValidPriceFeed(priceFeeds[i], PRICE_FEED_ERROR_MARGIN);
                _priceFeeds[tokens[i]] = AggregatorV3Interface(priceFeeds[i]);
            }
        }
        _allowedTokens.add(tokens);
        _allTokens.add(tokens);

        emit TokenAllowed(tokens, priceFeeds, minBetAmounts, msg.sender);
    }

    /// @notice Removes a batch of tokens from being allowed for betting and deletes associated price feeds
    /** @dev This function enables the contract owner to restrict certain tokens from being used in betting activities.
     * It involves removing tokens from the list of allowed tokens, potentially removing them from the list of tokens
     * without a Chainlink price feed (oracless tokens), and deleting their associated price feeds if any were set.
     * This is a crucial administrative function for managing the tokens that can be used on the platform, allowing
     * for adjustments based on compliance, liquidity, or other operational considerations.
     * Execution is restricted to the contract's owner through the `onlyOwner` modifier, ensuring that token restrictions
     * can only be imposed by authorized parties.
     * @param tokens An array of token addresses that are to be restricted from use in betting.
     */
    function restrictTokens(address[] memory tokens) external onlyOwner {
        uint256 tokensLength = tokens.length;
        for (uint256 i = 0; i < tokensLength; ++i) {
            if (!_allowedTokens.contains(tokens[i])) {
                revert ErrorMessage(47);
            }
            delete _priceFeeds[tokens[i]];
            delete _oraclessTokensMinBetAmount[tokens[i]];
        }

        _allowedTokens.remove(tokens);
        _oraclessTokens.remove(tokens);

        emit TokenRestricted(tokens, msg.sender);
    }

    /// @notice Sets the rules for administrative shares on betting winnings based on thresholds
    /** @dev Allows the contract owner to define how administrative shares (a portion of betting winnings) are calculated.
     * This can be configured differently for the STMX token versus other tokens, as indicated by the `isSTMX` flag.
     * Each entry in the `thresholds` and `sharesInUSD` arrays defines a tier: if the winnings fall into a certain threshold,
     * the corresponding percentage is applied as the administrative share. The function enforces ascending order for thresholds
     * and ensures that the share in USD do not exceed a maximum limit. This setup allows for flexible configuration
     * of administrative fees based on the amount won.
     * Access is restricted to the contract owner through the `onlyOwner` modifier, ensuring that only they can set these rules.
     * @param thresholds An array of threshold values, each representing the lower bound of a winnings bracket.
     * @param sharesInUSD An array of sharesInUSD corresponding to each threshold, defining the admin share for that bracket.
     * @param token Token address.
     * @param isSTMX A boolean flag indicating whether these rules apply to the STMX token (`true`) or other tokens (`false`).
     *
     * Requirements:
     * - The `thresholds` and `sharesInUSD` arrays must be of equal length and not empty, ensuring each threshold has a corresponding percentage.
     * - Thresholds must be in ascending order, and all sharesInUSD must not exceed the predefined maximum admin share percentage.
     */
    function setAdminShareRules(
        uint256[] memory thresholds,
        uint256[] memory sharesInUSD,
        address token,
        bool isSTMX
    ) external onlyOwner {
        if (!_allTokens.contains(token)) {
            revert ErrorMessage(48);
        }
        uint256 thresholdsLength = thresholds.length;
        uint256 sharesInUSDLength = sharesInUSD.length;

        if (
            thresholdsLength <= 0 ||
            thresholdsLength != sharesInUSDLength ||
            thresholdsLength > MAX_ADMIN_SHARE_THRESHOLDS
        ) {
            revert ErrorMessage(9);
        }

        uint256 maxAdminShare = MAX_ADMIN_SHARE_IN_USD;

        for (uint256 i = 0; i < thresholdsLength - 1; ++i) {
            if (thresholds[i] > thresholds[i + 1]) {
                revert ErrorMessage(21);
            }
            if (isSTMX) {
                maxAdminShare = MAX_ADMIN_SHARE_STMX;
            }

            if (sharesInUSD[i] > maxAdminShare) {
                revert ErrorMessage(22);
            }
        }

        if (isSTMX) {
            maxAdminShare = MAX_ADMIN_SHARE_STMX;
        }

        if (sharesInUSD[sharesInUSDLength - 1] > maxAdminShare) {
            revert ErrorMessage(22);
        }

        _adminShareRules[token] = AdminShareRule({
            sharesInUSD: sharesInUSD,
            thresholds: thresholds,
            isSTMX: isSTMX
        });

        emit AdminShareRulesUpdated(_adminShareRules[token], msg.sender);
    }

    /// @notice Update the maximum challenger limits
    /**
     * Access is restricted to the contract owner through the `onlyOwner` modifier, ensuring that only they can set these rules.
     * @param _maxChallengersPerChallenge maximun limit of challengers can join for pickem.
     */
    function updateMaxChallengers(uint256 _maxChallengersPerChallenge) external onlyOwner {
        if (_maxChallengersPerChallenge <= 0 || _maxChallengersPerChallenge > 50) {
            revert ErrorMessage(23);
        }
        maxChallengersPerChallenge = _maxChallengersPerChallenge;

        emit MaxChallengersUpdated(_maxChallengersPerChallenge, msg.sender);
    }

    /// @notice Owner is able to deposit tokens in SC under the owner's withdrawbales, to use the owner withdrawables in user's bets
    /**
     * Access is restricted to the contract owner through the `onlyOwner` modifier, ensuring that only owner can deposit amount to SC.
     * @param _amount amount of tokens.
     * @param _token token address.
     */
    function debitInSC(uint256 _amount, address _token) external payable onlyOwner {
        if (!_allowedTokens.contains(_token)) {
            revert ErrorMessage(3);
        }

        if (_amount <= 0) {
            revert ErrorMessage(28);
        }

        if (_token == address(0)) {
            if (msg.value != _amount) {
                revert ErrorMessage(29);
            }
        } else {
            if (msg.value != 0) {
                revert ErrorMessage(34);
            }
            IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        }
        _withdrawables[msg.sender][_token] += _amount;
        emit DebitedInSC(_withdrawables[msg.sender][_token], msg.sender);
    }

    /// @notice Retrieves the administrative share rules for either the STMX token or other tokens
    /** @dev This function provides external access to the administrative share rules that have been set up for either
     * the STMX token (if `isSTMX` is true) or for other tokens (if `isSTMX` is false). These rules define the thresholds
     * and corresponding percentages that determine how administrative shares are calculated from betting winnings.
     * The function returns two arrays: one for the thresholds and one for the percentages, which together outline the
     * structure of admin shares based on the amount of winnings.
     * @param token A boolean flag indicating whether to retrieve the rules for the STMX token (`true`) or other tokens (`false`).
     * @return thresholds An array of uint256 representing the winnings thresholds for admin shares calculation.
     * @return sharesInUSD An array of uint256 representing the admin share in USD for each corresponding threshold.
     */
    function getAdminShareRules(
        address token
    )
        external
        view
        returns (uint256[] memory thresholds, uint256[] memory sharesInUSD, bool isSTMX)
    {
        AdminShareRule storage rule = _adminShareRules[token];
        return (rule.thresholds, rule.sharesInUSD, rule.isSTMX);
    }

    /// @notice Retrieves the list of tokens currently allowed for betting
    /** @dev This function provides external visibility into which tokens are currently permitted for use in betting within the platform.
     * It leverages the EnumerableSet library from OpenZeppelin to handle the dynamic array of addresses representing the allowed tokens.
     * This is particularly useful for interfaces or external contracts that need to verify or display the tokens users can bet with.
     * @return An array of addresses, each representing a token that is allowed for betting.
     */
    function getAllowedTokens() external view returns (address[] memory) {
        return _allowedTokens.values();
    }

    /// @notice Fetches detailed information about a specific challenge by its ID
    /** @dev This function provides access to the details of a given challenge, including its current status, which is
     * dynamically determined based on the challenge's timing and resolution state. It's essential for external callers
     * to be able to retrieve comprehensive data on a challenge, such as its participants, status, and betting amounts,
     * to properly interact with or display information about the challenge. The function checks that the requested
     * challenge exists before attempting to access its details.
     * @param challengeId The unique identifier of the challenge for which details are requested.
     * @return challengeDetails A `Challenge` struct containing all relevant data about the challenge, including an updated status.
     *
     * Requirements:
     * - The challenge must exist, as indicated by its ID being within the range of created challenges.
     */
    function getChallengeDetails(
        uint256 challengeId
    ) external view returns (Challenge memory challengeDetails) {
        _assertChallengeExistence(challengeId);
        challengeDetails = _challenges[challengeId];

        challengeDetails.status = _challengeStatus(challengeId);
    }

    /// @notice Retrieves the bet details placed by a specific user on a particular challenge
    /** @dev This function allows anyone to view the details of a bet made by a user on a specific challenge,
     * including the amount bet and the side the user has chosen. It's crucial for enabling users or interfaces
     * to confirm the details of participation in challenges and to understand the stakes involved. This function
     * directly accesses the mapping of user bets based on the user address and challenge ID, returning the
     * corresponding `UserBet` struct.
     * @param challengeId The ID of the challenge for which the bet details are being queried.
     * @param user The address of the user whose bet details are requested.
     * @return A `UserBet` struct containing the amount of the bet and the decision (side chosen) by the user for the specified challenge.
     */
    function getUserBet(uint256 challengeId, address user) external view returns (UserBet memory) {
        return _userChallengeBets[user][challengeId];
    }

    /// @notice Provides a list of tokens and corresponding amounts available for withdrawal by a specific user
    /** @dev This function compiles a comprehensive view of all tokens that a user has available to withdraw,
     * including winnings, refunds, or other credits due to the user. It iterates over the entire list of tokens
     * recognized by the contract (not just those currently allowed for betting) to ensure that users can access
     * any funds owed to them, regardless of whether a token's betting status has changed. This is essential for
     * maintaining transparency and access to funds for users within the platform.
     * @param user The address of the user for whom withdrawable balances are being queried.
     * @return tokens An array of token addresses, representing each token that the user has a balance of.
     * @return amounts An array of uint256 values, each corresponding to the balance of the token at the same index in the `tokens` array.
     */
    function getUserWithdrawables(
        address user
    ) external view returns (address[] memory tokens, uint256[] memory amounts) {
        uint256 allTokensLength = _allTokens.length();

        tokens = new address[](allTokensLength);
        amounts = new uint256[](allTokensLength);

        for (uint256 i = 0; i < allTokensLength; ++i) {
            tokens[i] = _allTokens.at(i);
            amounts[i] = _withdrawables[user][tokens[i]];
        }
    }

    /// @notice verify the membership proof from merkle tree
    /** @dev If merkle proof got verified it will return true otherwise false
     * @param proof leaf nood proof
     * @param membershipLevel user membership level
     * @param feePercentage percentage amount reduced from admin share
     * @param referrer referrer address
     * @param referralCommision referral will get the comission from admin share
     * @return bool Returns true if proof got verified, false otherwise.
     */
    function verifyMembership(
        bytes32[] memory proof,
        uint256 membershipLevel,
        uint256 feePercentage,
        address referrer,
        uint256 referralCommision
    ) internal view returns (bool) {
        bytes32 leaf = keccak256(
            bytes.concat(
                keccak256(
                    abi.encode(
                        msg.sender,
                        membershipLevel,
                        feePercentage,
                        referrer,
                        referralCommision
                    )
                )
            )
        );
        if (!MerkleProof.verify(proof, merkleRoot, leaf)) {
            revert ErrorMessage(45);
        }
        return true;
    }

    /**
     * @dev Allows a user to join a challenge, handling the financial transactions involved, including admin fees.
     * This internal function processes a user's bet on a challenge, taking into account amounts from the user's wallet and
     * withdrawable balance. It calculates and deducts an admin share based on the total bet amount and updates the challenge
     * and user's records accordingly.
     *
     * @param challengeId The unique identifier of the challenge the user wishes to join.
     * @param amountFromWallet The portion of the user's bet that will be taken from their wallet.
     * @param amountFromWithdrawables The portion of the user's bet that will be taken from their withdrawable balance.
     * @param membershipLevel user membership level
     * @param feePercentage percentage amount reduced from admin share
     * @param referrer referrer address
     * @param referralCommision referral will get the comission from admin share
     * @param proof leaf nood proof
     *
     * The function enforces several checks and conditions:
     * - The total bet amount must exceed the admin share calculated for the transaction.
     * - The user must have sufficient withdrawable balance if opting to use it.
     * - Transfers the required amount from the user's wallet if applicable.
     * - Updates the admin's withdrawable balance with the admin share.
     * - Adds the user to the challenge participants and updates the challenge's total amount for or against based on the user's decision.
     * - Ensures the number of participants does not exceed the maximum allowed.
     * - Records the user's bet details.
     *
     * Emits a `ChallengeJoined` event upon successful joining of the challenge.
     * Emits an `AdminShareCalculated` event to indicate the admin share calculated from the user's bet.
     *
     * Requirements:
     * - The sum of `amountFromWallet` and `amountFromWithdrawables` must be greater than the admin share.
     * - If using withdrawables, the user must have enough balance.
     * - The challenge token must be transferred successfully from the user's wallet if necessary.
     * - The challenge's participants count must not exceed `maxChallengersPerChallenge`.
     *
     * Notes:
     * - This function uses the nonReentrant modifier to prevent reentry attacks.
     * - It supports participation in both individual and group challenges.
     * - Admin shares are calculated and deducted from the user's total bet amount to ensure fair administration fees.
     */
    function _joinChallenge(
        uint256 challengeId,
        uint256 amountFromWallet,
        uint256 amountFromWithdrawables,
        uint8 membershipLevel,
        uint256 feePercentage,
        address referrer,
        uint256 referralCommision,
        bytes32[] memory proof
    ) internal nonReentrant {
        Challenge storage _challenge = _challenges[challengeId];
        (
            uint256 amount,
            uint256 adminShare,
            uint256 referralCommisionAmount
        ) = _calculateChallengeAmounts(
                _challenge.token,
                amountFromWallet,
                amountFromWithdrawables,
                challengeId,
                membershipLevel,
                feePercentage,
                referrer,
                referralCommision,
                proof,
                true
            );

        uint256 participants;

        _challenge.users.push(msg.sender);
        participants = _challenge.users.length;
        _challenge.amount += amount;

        if (participants > maxChallengersPerChallenge) {
            revert ErrorMessage(30);
        }

        _userChallengeBets[msg.sender][challengeId] = UserBet({
            amount: amount,
            adminShare: adminShare,
            referrer: referrer,
            referralCommision: referralCommisionAmount
        });

        // Emit events for challenge joined and admin received shares
        emit ChallengeJoined(
            challengeId,
            amount,
            msg.sender,
            _challenge.token,
            amountFromWallet + amountFromWithdrawables
        );
        emit AdminShareCalculated(challengeId, _challenge.token, adminShare);
    }

    /// @notice calculate the challenge bet amount
    /**
     * @param challengeToken token in which user tried to bet
     * @param amountFromWallet amount which will be deducted from the users wallet
     * @param amountFromWithdrawables amount which will be deducted from the users withdrawables
     * @param membershipLevel user membership level
     * @param feePercentage percentage amount reduced from admin share 
     * @param referrer referrer address
     * @param referralCommision referral will get the comission from admin share
     * @param proof leaf nood proof
     * @return amount of the bet
     * @return admin share on bet amount
     
     */
    function _calculateChallengeAmounts(
        address challengeToken,
        uint256 amountFromWallet,
        uint256 amountFromWithdrawables,
        uint256 challengeId,
        uint8 membershipLevel,
        uint256 feePercentage,
        address referrer,
        uint256 referralCommision,
        bytes32[] memory proof,
        bool checkMinUsdAmounts
    ) internal returns (uint256, uint256, uint256) {
        if (!bettingAllowed) {
            revert ErrorMessage(31);
        }

        if (_challengeStatus(challengeId) != ChallengeStatus.Betting) {
            revert ErrorMessage(32);
        }

        if (challengeToken == address(0)) {
            if (amountFromWallet != msg.value) {
                revert ErrorMessage(33);
            }
        } else {
            if (msg.value != 0) {
                revert ErrorMessage(34);
            }
        }
        uint256 amount = amountFromWallet + amountFromWithdrawables;
        uint256 adminShare = _calculateAdminShare(challengeToken, amount);
        uint256 referralCommisionAmount;
        if (applyMembershipValues) {
            verifyMembership(proof, membershipLevel, feePercentage, referrer, referralCommision);
            adminShare = (adminShare * ((100 * 10 ** 20) - feePercentage)) / (100 * 10 ** 20);

            if (referrer != address(0)) {
                referralCommisionAmount = adminShare; // admin share amount with refferral commision amount

                // deduct the referral commission from admin share
                adminShare =
                    (adminShare * ((100 * 10 ** 20) - referralCommision)) /
                    (100 * 10 ** 20);
                referralCommisionAmount -= adminShare;
            }
        }
        // Ensure that the total amount is greater than the admin share per challenge
        if (amount <= adminShare) {
            revert ErrorMessage(35);
        }
        uint256 valueAmount = (_getValue(challengeToken) * amount) /
            10 ** (challengeToken == address(0) ? 18 : challengeToken.decimals());

        if (_oraclessTokens.contains(challengeToken)) {
            if (valueAmount < _oraclessTokensMinBetAmount[challengeToken]) {
                revert ErrorMessage(28);
            }
        } else {
            if (checkMinUsdAmounts && valueAmount < minUSDBetAmount) {
                revert ErrorMessage(28);
            }
        }

        // Deduct the amount from the withdrawables if bet amount is from withdrawables
        if (amountFromWithdrawables > 0) {
            if (_withdrawables[msg.sender][challengeToken] < amountFromWithdrawables) {
                revert ErrorMessage(36);
            }
            _withdrawables[msg.sender][challengeToken] -= amountFromWithdrawables;
        }

        // Transfer the amount from the user's wallet to the contract
        if (challengeToken != address(0)) {
            IERC20(challengeToken).safeTransferFrom(msg.sender, address(this), amountFromWallet);
        }

        amount -= (adminShare + referralCommisionAmount);
        return (amount, adminShare, referralCommisionAmount);
    }

    /**
     * @dev Cancels a user's participation in a given challenge, refunding their bet and updating the challenge's state.
     * This internal function handles the cancellation process for both individual and group challenges.
     * It adjusts the challenge's total bet amount and participant list based on the user's decision (for or against).
     * Additionally, it increments the user's withdrawable balance by the amount of their canceled bet.
     *
     * @param user The address of the user whose participation is being canceled.
     * @param challengeId The unique identifier of the challenge from which the user is withdrawing.
     *
     * The function performs the following operations:
     * - Identifies whether the user was betting for or against the challenge, or if it's a group challenge.
     * - Removes the user from the appropriate participant list (`users`) and adjusts the challenge's
     *   total amount for or against accordingly.
     * - Increases the user's withdrawable balance by the amount of their bet.
     * - Emits a `CancelParticipation` event signaling the user's cancellation from the challenge.
     * - Emits a `ChallengeFundsMoved` event to indicate the movement of funds due to the cancellation, for consistency and tracking.
     *
     * Notes:
     * - This function is designed to work with both individual and group challenges, modifying the challenge's state
     *   to reflect the user's cancellation and ensuring the integrity of the challenge's betting totals.
     * - It utilizes the `contains` function to find the user's position in the participant lists and handles their removal efficiently.
     * - The adjustment of the challenge's betting totals and participant lists is crucial for maintaining accurate and fair
     *   challenge outcomes and balances.
     */
    function _cancelParticipation(address user, uint256 challengeId, uint8 cancelType) internal {
        Challenge storage _challenge = _challenges[challengeId];
        address challengeToken = _challenge.token;

        uint256 usersLength = _challenge.users.length;

        address[] memory users = new address[](1);
        uint256[] memory amounts = new uint256[](1);
        address[] memory referrers = new address[](1);
        uint256[] memory referrelCommissions = new uint256[](1);

        uint256 amount = _userChallengeBets[user][challengeId].amount;
        uint256 adminShare = _userChallengeBets[user][challengeId].adminShare;
        uint256 referralCommision = _userChallengeBets[user][challengeId].referralCommision;
        address referrer = _userChallengeBets[user][challengeId].referrer;
        uint256 i = contains(_challenge.users, user);
        if (cancelType == 1) {
            amount += adminShare + referralCommision;
        } else {
            _withdrawables[owner()][challengeToken] += adminShare;
            _withdrawables[referrer][challengeToken] += referralCommision;
        }
        _withdrawables[user][challengeToken] += amount;
        _challenge.amount -= amount;
        _challenge.users[i] = _challenge.users[usersLength - 1];
        _challenge.users.pop();
        // Prepare data for event emission
        users[0] = user;
        amounts[0] = amount;
        referrers[0] = referrer;
        referrelCommissions[0] = referralCommision;

        // Clear user's bet for the challenge
        delete _userChallengeBets[user][challengeId];

        // Emit events for cancellation of participation and fund movement
        emit CancelParticipation(user, challengeId);
        emit ReferralsEarned(challengeId, _challenge.token, referrers, referrelCommissions);
        emit AdminReceived(challengeId, _challenge.token, adminShare);

        emit ChallengeFundsMoved(
            challengeId,
            users,
            amounts,
            new address[](0),
            new uint256[](0),
            MethodType.CancelParticipation,
            _challenge.token
        );
    }

    /**
     * @dev Calculates and allocates winnings and losses for a challenge.
     * This internal function determines the amounts won by each winning user and the amounts lost by each losing user
     * within a challenge. It updates the `_withdrawables` mapping to reflect the winnings for each winning user based
     * on their share of the profits. Losing users' bet amounts are noted but not immediately acted upon in this function.
     *
     * @param challengeId The unique identifier of the challenge being calculated.
     * @param usersWin An array of addresses for users who won in the challenge.
     * @param profits An array of profit percentages corresponding to each winning user.
     *
     * Requirements:
     * - `usersWin` and `profits` arrays must be of the same length, with each entry in `profits` representing
     *   the percentage of the total winnings that the corresponding user in `usersWin` should receive.
     * - This function does not directly handle the transfer of funds but updates the `_withdrawables` mapping to
     *   reflect the amounts that winning users are able to withdraw.
     * - Losing users' details are aggregated but are used primarily for event emission.
     *
     * Emits a `ChallengeFundsMoved` event indicating the challenge ID, winning users and their win amounts,
     * and losing users with the amounts they bet and lost. This helps in tracking the outcome and settlements
     * of group challenges.
     *
     * Note:
     * - The actual transfer of funds from losing to winning users is not performed in this function. Instead, it calculates
     *   and updates balances that users can later withdraw.
     */
    function _calculateChallenge(
        uint256 challengeId,
        address[] calldata usersWin,
        uint256[] calldata profits
    ) internal {
        Challenge storage _challenge = _challenges[challengeId];
        address challengeToken = _challenge.token;
        uint256 userWinLength = usersWin.length;
        address[] storage users = _challenge.users;
        uint256 challengeUserLength = users.length;
        uint256[] memory winAmounts = new uint256[](userWinLength);
        uint256[] memory loseAmounts = new uint256[](challengeUserLength - userWinLength);
        address[] memory usersLose = new address[](challengeUserLength - userWinLength);
        address[] memory referrers = new address[](challengeUserLength);
        uint256[] memory referrelCommissions = new uint256[](challengeUserLength);

        uint256 j = 0;
        uint256 adminShare;
        for (uint256 i = 0; i < challengeUserLength; ++i) {
            uint256 index = contains(usersWin, _challenge.users[i]);
            UserBet storage bet = _userChallengeBets[users[i]][challengeId];
            if (index == userWinLength) {
                usersLose[j] = users[i];
                loseAmounts[j] = bet.amount;
                j++;
            } else {
                uint256 winAmount = (_challenge.amount * profits[index]) / (100 * DECIMAL);
                _withdrawables[usersWin[index]][challengeToken] += winAmount;
                winAmounts[index] = winAmount;
            }
            adminShare += bet.adminShare;
            _withdrawables[bet.referrer][_challenge.token] += bet.referralCommision;
            referrers[i] = bet.referrer;
            referrelCommissions[i] = bet.referralCommision;
        }
        _withdrawables[owner()][_challenge.token] += adminShare;

        // Emit event for fund movement in the group challenge
        emit ReferralsEarned(challengeId, challengeToken, referrers, referrelCommissions);
        emit AdminReceived(challengeId, challengeToken, adminShare);

        emit ChallengeFundsMoved(
            challengeId,
            usersWin,
            winAmounts,
            usersLose,
            loseAmounts,
            MethodType.ResolveChallenge,
            challengeToken
        );
    }

    /**
     * @dev Searches for an element in an address array and returns its index if found.
     * This internal pure function iterates through an array of addresses to find a specified element.
     * It's designed to check the presence of an address in a given array and identify its position.
     *
     * @param array The array of addresses to search through.
     * @param element The address to search for within the array.
     * @return The index of the element within the array if found; otherwise, returns the length of the array.
     * This means that if the return value is equal to the array's length, the element is not present in the array.
     */
    function contains(address[] memory array, address element) internal pure returns (uint256) {
        uint256 arrayLength = array.length;
        for (uint256 i = 0; i < arrayLength; ++i) {
            if (array[i] == element) {
                return i;
            }
        }
        return arrayLength;
    }

    /**
     * @dev Cancels all bets placed on a challenge, refunding the bet amounts to the bettors.
     * This internal function handles the process of cancelling bets for both "for" and "against" positions in a given challenge.
     * It aggregates users and their respective bet amounts from both positions, updates their withdrawable balances,
     * and emits an event indicating the movement of funds due to the challenge's cancellation.
     *
     * The function iterates through all bets placed "for" and "against" the challenge, compiles lists of users and their bet amounts,
     * and credits the bet amounts back to the users' withdrawable balances in the form of the challenge's token.
     *
     * @param challengeId The unique identifier of the challenge whose bets are to be cancelled.
     *
     * Emits a `ChallengeFundsMoved` event with details about the challengeId, users involved, their refunded amounts,
     * and empty arrays for new users and new amounts as no new bets are created during the cancellation process.
     *
     * Requirements:
     * - The function is internal and expected to be called in scenarios where a challenge needs to be cancelled, such as
     *   when a challenge is deemed invalid or when conditions for the challenge's execution are not met.
     * - It assumes that `_challenges` maps `challengeId` to a valid `Challenge` struct containing arrays of users who have bet "for" and "against".
     * - The function updates `_withdrawables`, a mapping of user addresses to another mapping of token addresses and their withdrawable amounts, ensuring users can withdraw their bet amounts after the bets are cancelled.
     */
    function _cancelBets(uint256 challengeId, uint8 cancelType) internal {
        Challenge storage _challenge = _challenges[challengeId];
        address challengeToken = _challenge.token;

        uint256 usersLength = _challenge.users.length;

        address[] memory users = new address[](usersLength);
        uint256[] memory amounts = new uint256[](usersLength);
        address[] memory referrers = new address[](usersLength);
        uint256[] memory referrelCommissions = new uint256[](usersLength);

        uint256 j = 0;
        uint256 totalAdminShare = 0;
        for (uint256 i = 0; i < usersLength; ++i) {
            address user = _challenge.users[i];

            users[i] = user;
            uint256 returnAmount = _userChallengeBets[user][challengeId].amount;
            uint256 adminShare = _userChallengeBets[user][challengeId].adminShare;
            uint256 referralCommision = _userChallengeBets[user][challengeId].referralCommision;
            address referrer = _userChallengeBets[user][challengeId].referrer;

            if (cancelType == 1) {
                returnAmount += adminShare + referralCommision;
                adminShare = 0;
                referralCommision = 0;
            } else {
                _withdrawables[owner()][challengeToken] += adminShare;
                _withdrawables[referrer][challengeToken] += referralCommision;
            }
            amounts[i] = returnAmount;
            referrers[j] = referrer;
            referrelCommissions[j] = referralCommision;
            _withdrawables[user][challengeToken] += amounts[i];
            totalAdminShare += adminShare;
            ++j;
        }

        emit ReferralsEarned(challengeId, challengeToken, referrers, referrelCommissions);
        emit AdminReceived(challengeId, challengeToken, totalAdminShare);

        emit ChallengeFundsMoved(
            challengeId,
            users,
            amounts,
            new address[](0),
            new uint256[](0),
            MethodType.CancelChallenge,
            challengeToken
        );
    }

    /**
     * @dev Withdraws an amount of native cryptocurrency (e.g., ETH) or an ERC-20 token and sends it to a specified address.
     * This internal function handles the transfer of both native cryptocurrency and ERC-20 tokens based on the token address provided.
     * If the `token` parameter is the zero address, it treats the transfer as a native cryptocurrency transaction.
     * Otherwise, it performs a safe transfer of an ERC-20 token.
     *
     * @param token The address of the token to withdraw. If the address is `0x0`, the withdrawal is processed as a native cryptocurrency transaction.
     * @param to The recipient address to which the currency or tokens are sent.
     * @param amount The amount of currency or tokens to send. The function ensures that this amount is securely transferred to the `to` address.
     *
     * Requirements:
     * - For native cryptocurrency transfers:
     *   - The transaction must succeed. If it fails, the function reverts with "Failed to send ETH".
     * - For ERC-20 token transfers:
     *   - The function uses `safeTransfer` from the IERC20 interface to prevent issues related to double spending or errors in transfer.
     *   - The ERC-20 token contract must implement `safeTransfer` correctly according to the ERC-20 standard.
     */
    function _withdraw(address token, address to, uint256 amount) internal {
        if (token == address(0)) {
            // Native cryptocurrency transfer
            (bool ok, ) = to.call{value: amount}("");
            require(ok, "37");
        } else {
            // ERC-20 token transfer
            IERC20(token).safeTransfer(to, amount);
        }
    }

    /**
     * @dev Calculates the administrator's share of a challenge based on the challenge's token and the amount.
     * This internal view function determines the admin's share by first converting the `amount` of the challenge's
     * token into a standardized value (using `_getValue` function to get the token's value in a common denomination).
     * It then uses this value to find the applicable admin share percentage from a predefined set of rules (`_adminShareRules`).
     *
     * @param token The token of the challenge to calculate the value amount.
     * @param amount The amount involved in the challenge for which the admin's share is to be calculated.
     * @return The calculated admin share as a uint256, based on the challenge's conditions and predefined rules.
     *
     * Logic:
     * - Determines the value of the `amount` of tokens by fetching the token's current value and adjusting for decimal places.
     * - Uses the calculated value to find the corresponding admin share percentage from `_adminShareRules`.
     * - The share is computed based on thresholds which determine the percentage rate applicable to the value amount.
     * - If the value amount does not meet the minimum threshold, the function returns 0, indicating no admin share.
     * - If applicable, the admin share is calculated by multiplying the `amount` by the determined percentage
     *   and dividing by `PERCENTAGE_100` to ensure the result is in the correct scale.
     *
     * Requirements:
     * - The function dynamically adjusts for the token's decimals, using 18 decimals for the native currency (e.g., ETH) or
     *   querying the token contract for ERC-20 tokens.
     * - It handles special cases, such as when the token is the platform's specific token (e.g. STMX),
     *   by applying predefined rules for calculating the admin share.
     */
    function _calculateAdminShare(address token, uint256 amount) internal view returns (uint256) {
        // This should be removed from here TBD
        // if(!_allTokens.contains(token)){
        //     revert ErrorMessage(48);
        // }

        uint256 valueAmount = (_getValue(token) * amount) /
            10 ** (token == address(0) ? 18 : token.decimals());

        AdminShareRule storage rule = _adminShareRules[token];

        uint256 index = rule.thresholds.upperBound(valueAmount);

        if (index == 0) {
            return 0;
        }
        // Get the admin share in USD for the corresponding threshold
        uint256 shareInUSD = rule.sharesInUSD[index - 1];

        if (rule.isSTMX) {
            return shareInUSD;
        }

        // Convert the USD share back into the equivalent token amount
        uint256 adminShareInTokens = (shareInUSD *
            10 ** (token == address(0) ? 18 : token.decimals())) / _getValue(token);

        return adminShareInTokens;
    }

    /**
     * @dev Retrieves the current value of a given token, based on oracle data.
     * This internal view function queries the value of the specified token from a price feed oracle.
     * If the token is recognized by a preset list of oracles (_oraclessTokens), it returns a default value.
     * Otherwise, it fetches the latest round data from the token's associated price feed.
     * The function requires that the oracle's reported value be positive and updated within the last day,
     * indicating no oracle malfunction.
     * It adjusts the oracle's value based on a default decimal precision, to ensure consistency across different oracles.
     *
     * @param token The address of the token for which the value is being queried.
     * @return The current value of the token as a uint256, adjusted for default decimal precision.
     * The value is adjusted to match the `DEFAULT_ORACLE_DECIMALS` precision if necessary.
     *
     * Requirements:
     * - The oracle's latest value for the token must be positive and updated within the last 24 hours.
     * - If the token is not recognized by the _oraclessTokens set, but has a price feed, the function normalizes the
     *   value to a standard decimal precision (DEFAULT_ORACLE_DECIMALS) for consistency.
     * - Throws "Oracle malfunction" if the oracle's latest data does not meet the requirements.
     */
    function _getValue(address token) internal view returns (uint256) {
        int256 value;
        uint256 updatedAt;

        if (_oraclessTokens.contains(token)) {
            value = int256(10 ** DEFAULT_ORACLE_DECIMALS);
        } else {
            (, value, , updatedAt, ) = _priceFeeds[token].latestRoundData();
            if (value <= 0 || updatedAt < block.timestamp - 1 days) {
                revert ErrorMessage(43);
            }
            uint256 oracleDecimals = _priceFeeds[token].decimals();
            if (oracleDecimals > DEFAULT_ORACLE_DECIMALS) {
                value = value / int256(10 ** (oracleDecimals - DEFAULT_ORACLE_DECIMALS));
            } else if (oracleDecimals < DEFAULT_ORACLE_DECIMALS) {
                value = value * int256(10 ** (DEFAULT_ORACLE_DECIMALS - oracleDecimals));
            }
        }

        return uint256(value);
    }

    /**
     * @dev Determines the current status of a specific challenge by its ID.
     * This internal view function assesses the challenge's status based on its current state and timing.
     * It checks if the challenge is in a final state (Canceled, Resolved).
     * If not, it then checks whether the challenge's end time has passed to determine if it's in the Awaiting state.
     * Otherwise, it defaults to the Betting state, implying that the challenge is still active and accepting bets.
     *
     * @param challengeId The unique identifier for the challenge whose status is being queried.
     * @return ChallengeStatus The current status of the challenge. This can be one of the following:
     * - Canceled: The challenge has been canceled.
     * - Resolved: The challenge has been resolved in favor of the proposer.
     * - Awaiting: The challenge is awaiting resolution, but betting is closed due to the end time having passed.
     * - Betting: The challenge is open for bets.
     */
    function _challengeStatus(uint256 challengeId) internal view returns (ChallengeStatus) {
        ChallengeStatus status = _challenges[challengeId].status;
        uint256 endTime = _challenges[challengeId].endTime;

        if (status == ChallengeStatus.Canceled || status == ChallengeStatus.Resolved) {
            return status;
        }

        if (block.timestamp > endTime) {
            return ChallengeStatus.Awaiting;
        }

        return ChallengeStatus.Betting;
    }

    /**
     * @dev Checks if the challenge id is valid or not.
     *
     * @param challengeId The unique identifier for the challenge.
     */
    function _assertChallengeExistence(uint256 challengeId) internal view {
        if (challengeId <= 0 || challengeId > latestChallengeId) {
            revert ErrorMessage(38);
        }
    }

    /**
     * @dev Checks if the challenge is resolved or not.
     *
     * @param challengeId The unique identifier for the challenge.
     */
    function _assertResolveableStatus(uint256 challengeId) internal view {
        if (_challengeStatus(challengeId) != ChallengeStatus.Awaiting) {
            revert ErrorMessage(39);
        }
    }

    /**
     * @dev Checks if the challenge is canceled or not.
     *
     * @param challengeId The unique identifier for the challenge.
     */
    function _assertCancelableStatus(uint256 challengeId) internal view {
        ChallengeStatus status = _challengeStatus(challengeId);
        if (status != ChallengeStatus.Awaiting && status != ChallengeStatus.Betting) {
            revert ErrorMessage(40);
        }
    }

    /**
     * @dev Ensures that the function is only callable by the designated backend address.
     * This internal view function checks if the `msg.sender` is the same as the stored `backend` address.
     * It should be used as a modifier in functions that are meant to be accessible only by the backend.
     * Reverts with a "Not a backend" error message if the `msg.sender` is not the backend address.
     */
    function _onlyBackend() internal view {
        if (msg.sender != backend) {
            revert ErrorMessage(41);
        }
    }

    /**
     * @dev Ensures that the function is only callable by the designated backend address or owner address.
     * This internal view function checks if the `msg.sender` is the same as the stored `backend` address or owner address.
     * It should be used as a modifier in functions that are meant to be accessible by the backend and owner.
     * Reverts with a "Not a backend or owner" error message if the `msg.sender` is neither the backend address, nor the owner address.
     */
    function _onlyBackendOrOwner() internal view {
        if (msg.sender != backend && msg.sender != owner()) {
            revert ErrorMessage(42);
        }
    }

    /**
     * @dev Overrides the renounceOwnership function to disable the ability to renounce ownership.
     * This ensures that the contract always has an owner.
     */
    function renounceOwnership() public view override onlyOwner {
        revert("Renouncing ownership is disabled");
    }

    /**
     * @dev Checks if the price feed from a given address is valid within a specified error margin.
     * @param priceFeedAddress The address of the price feed.
     * @param errorMarginPercent The acceptable error margin in percentage.
     * @return bool Returns true if the price feed is valid, otherwise reverts.
     */
    function isValidPriceFeed(
        address priceFeedAddress,
        uint256 errorMarginPercent
    ) internal view returns (bool) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(priceFeedAddress);
        (, int256 price, , uint256 updatedAt, ) = priceFeed.latestRoundData();

        if (price <= 0) {
            revert ErrorMessage(19);
        }
        if (block.timestamp - updatedAt > 1 days) {
            revert ErrorMessage(25);
        }

        int256 expectedPrice = getExpectedPrice(priceFeedAddress);
        int256 lowerBound = expectedPrice - ((expectedPrice * int256(errorMarginPercent)) / 100);
        int256 upperBound = expectedPrice + ((expectedPrice * int256(errorMarginPercent)) / 100);

        if (price < lowerBound || price > upperBound) {
            revert ErrorMessage(27);
        }
        return true;
    }

    /**
     * @dev Computes the expected price from the historical price feed data.
     * @param priceFeedAddress The address of the price feed.
     * @return int256 The average price calculated from the last few rounds.
     */
    function getExpectedPrice(address priceFeedAddress) internal view returns (int256) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(priceFeedAddress);

        // Fetch the latest round data
        (uint80 roundID, , , , ) = priceFeed.latestRoundData();

        // Calculate the average price over the last few rounds
        int256 sum = 0;
        uint256 count = 0;
        uint80 currentRoundId = roundID;

        // Assuming we want to average the last 5 rounds
        uint256 roundsToAverage = 5;

        for (uint256 i = 0; i < roundsToAverage; ++i) {
            (, int256 historicalPrice, , , ) = priceFeed.getRoundData(currentRoundId);
            sum += historicalPrice;
            count += 1;

            if (currentRoundId > 0) {
                currentRoundId -= 1;
            } else {
                break;
            }
        }

        int256 averagePrice = sum / int256(count);

        return averagePrice;
    }
}

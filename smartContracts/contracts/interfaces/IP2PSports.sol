//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IP2PSports
 * @dev Interface for a peer-to-peer sports betting platform.
 * This interface defines the basic events, enums, and structs required for creating, joining, resolving,
 * and canceling challenges, as well as managing and withdrawing bets and admin shares in a decentralized sports betting platform.
 */
interface IP2PSports {
    /**
     * @dev Custom error to indicate specific error conditions using a code.
     *
     * This error is used to provide an error code that represents various failure
     * conditions in the contract, rather than using string messages. Using codes
     * minimizes gas usage compared to string-based revert messages.
     *
     * @param code The numeric code representing the specific error condition.
     * The messages corresponding to the error codes can be seen in the following document.
     * https://duelnow.notion.site/Smart-Contract-Error-Codes-ca7427520ce04ca293d3e21fb1e21583
     */
    error ErrorMessage(uint8 code);

    /**
     * @dev Emitted when the backend address changes.
     * @param backend The new backend address.
     * @param by The address of the user who changed the backend address.
     */
    event BackendChanged(address backend, address by);

    /**
     * @dev Emitted when the merkle root is updated.
     * @param root The new merkle root.
     * @param by The address of the user who updated the merkle root.
     */
    event MerkleRootUpdated(bytes32 root, address by);

    /**
     * @dev Emitted when the maximum number of challengers is updated.
     * @param maxWinnersPerChallenge The maximum number of challengers for pickem.
     * @param by The address of the user who updated the maximum number of challengers.
     */
    event MaxChallengersUpdated(uint256 maxWinnersPerChallenge, address by);

    /**
     * @dev Emitted when the minimum USD bet amount is updated.
     * @param amount The new minimum USD bet amount.
     * @param by The address of the user who updated the minimum USD bet amount.
     */
    event MinUSDBettingAmountUpdated(uint256 amount, address by);

    /**
     * @dev Emitted when the membership application status is updated.
     * @param value The new membership application status (true or false).
     * @param by The address of the user who updated the membership application status.
     */
    event MembershipApplied(bool value, address by);

    /**
     * @dev Emitted when betting is enabled or disabled.
     * @param value The new betting status (true or false).
     * @param by The address of the user who updated the betting status.
     */
    event BettingAllowed(bool value, address by);

    /**
     * @dev Emitted when the admin share rules are updated.
     * @param adminShareRules The new admin share rules.
     * @param by The address of the user who updated the admin share rules.
     */
    event AdminShareRulesUpdated(AdminShareRule adminShareRules, address by);

    /**
     * @dev Emitted when an amount is debited in SC.
     * @param amount The amount to be debited.
     * @param by The address of the user who initiated the debit.
     */
    event DebitedInSC(uint256 amount, address by);

    /**
     * @dev Emitted when a token is allowed.
     * @param tokens The addresses of the allowed tokens.
     * @param priceFeeds The addresses of the price feeds for the tokens.
     * @param minBetAmounts The minimum bet amounts for the tokens.
     * @param by The address of the user who allowed the tokens.
     */
    event TokenAllowed(
        address[] tokens,
        address[] priceFeeds,
        uint256[] minBetAmounts,
        address by
    );

    /**
     * @dev Emitted when tokens are restricted.
     * @param tokens The addresses of the restricted tokens.
     * @param by The address of the user who restricted the tokens.
     */
    event TokenRestricted(address[] tokens, address by);

    /**
     * @dev Emitted when a new challenge is created.
     * @param challengeId Unique identifier for the challenge.
     * @param token Address of the token used for betting.
     * @param by Address of the user who created the challenge.
     * @param inputStakedQty The original amount input by user, without any deductions
     */
    event ChallengeCreated(uint256 challengeId, address token, address by, uint256 inputStakedQty);

    /**
     * @dev Emitted when a user joins an existing challenge.
     * @param challengeId Unique identifier for the challenge.
     * @param amount Amount of the token bet by the user.
     * @param by Address of the user who joined the challenge.
     * @param inputStakedQty The original amount input by user, without any deductions
     * @param token Address of the token used for betting.
     */
    event ChallengeJoined(
        uint256 challengeId,
        uint256 amount,
        address by,
        address token,
        uint256 inputStakedQty
    );

    /**
     * @dev Emitted when a user increases amount for an already joined challenge.
     * @param challengeId Unique identifier for the challenge.
     * @param increasedAmount Amount that is added to the previous amount of the user for the specified bet.
     * @param newTotalAmount The new total amount of the user's participation in the bet.
     * @param by Address of the user who increased the challenge amount.
     * @param token Address of the token used for betting.
     */
    event BetAmountIncreased(
        uint256 challengeId,
        uint256 increasedAmount,
        uint256 newTotalAmount,
        address by,
        address token
    );

    /**
     * @dev Emitted when a challenge is resolved.
     * @param challengeId Unique identifier for the challenge.
     * @param finalOutcome Final outcome of the challenge (1 for win, 2 for loss, etc.).
     */
    event ChallengeResolved(uint256 challengeId, uint8 finalOutcome);

    /**
     * @dev Emitted when a challenge is canceled.
     * @param challengeId Unique identifier for the canceled challenge.
     */
    event ChallengeCanceled(uint256 challengeId);

    /**
     * @dev Emitted when a user cancels their participation in a challenge.
     * @param user Address of the user canceling their participation.
     * @param challengeId Unique identifier for the challenge.
     */
    event CancelParticipation(address user, uint256 challengeId);

    /**
     * @dev Emitted after the resolution of a challenge, detailing the redistribution of funds.
     * @param challengeId Unique identifier for the challenge.
     * @param winners Array of addresses of the winning users.
     * @param winnersProfit Array of profits earned by each winning user.
     * @param losers Array of addresses of the losing users.
     * @param losersLoss Array of amounts lost by each losing user.
     */
    event ChallengeFundsMoved(
        uint256 challengeId,
        address[] winners,
        uint256[] winnersProfit,
        address[] losers,
        uint256[] losersLoss,
        MethodType mothodType,
        address token
    );

    /**
     * @dev Emitted when a user withdraws their winnings or funds.
     * @param token Address of the token being withdrawn.
     * @param amount Amount of the token being withdrawn.
     * @param by Address of the user performing the withdrawal.
     */
    event UserWithdrawn(address token, uint256 amount, address by);

    /**
     * @dev Emitted when the admin shares is calculated from challenge participation fees.
     * @param challengeId Unique identifier for the challenge from which the fees were taken.
     * @param token Address of the token in which the fees were paid.
     * @param amount Amount of the fees received.
     */
    event AdminShareCalculated(uint256 challengeId, address token, uint256 amount);

    /**
     * @dev Emitted when the admin receives a share from challenge participation fees.
     * @param challengeId Unique identifier for the challenge from which the fees were taken.
     * @param token Address of the token in which the fees were paid.
     * @param amount Amount of the fees received.
     */
    event AdminReceived(uint256 challengeId, address token, uint256 amount);

    /**
     * @dev Emitted when the referrel commission is earned by the referrer from challenge participation fees.
     * @param challengeId Unique identifier for the challenge from which the fees were taken.
     * @param token Address of the token in which the fees were paid.
     * @param referrers addresses of the referrers.
     * @param referrelCommissions Amount of the fees received.
     */
    event ReferralsEarned(
        uint256 challengeId,
        address token,
        address[] referrers,
        uint256[] referrelCommissions
    );

    /**
     * @dev Emitted when the admin withdraws their accumulated shares.
     * @param token Address of the token being withdrawn.
     * @param amount Amount of the token being withdrawn.
     */
    event AdminWithdrawn(address token, uint256 amount);

    /**
     * @dev Enum for tracking the status of a challenge.
     */
    enum ChallengeStatus {
        None,
        CanBeCreated,
        Betting,
        Awaiting,
        Canceled,
        Resolved
    }
    /**
     * @dev Enum for the functions in which the fund are being distributed.
     */
    enum MethodType {
        ResolveChallenge,
        CancelChallenge,
        CancelParticipation
    }

    /**
     * @dev Struct for storing details about a challenge.
     */
    struct Challenge {
        address token; // Token used for betting.
        address[] users; // Users betting for the outcome.
        uint256 amount; // Total amount bet for the outcome.
        ChallengeStatus status; // Current status of the challenge.
        uint256 startTime; // Start time of the challenge.
        uint256 endTime; // End time of the challenge.
    }

    /**
     * @dev Struct for storing a user's bet on a challenge.
     */
    struct UserBet {
        uint256 amount; // Amount of the bet.
        uint256 adminShare; //Admin's share calculated for this bet amount
        address referrer;
        uint256 referralCommision;
    }

    /**
     * @dev Struct for defining admin share rules based on bet thresholds.
     */
    struct AdminShareRule {
        uint256[] thresholds; // Bet amount thresholds for different share percentages.
        uint256[] sharesInUSD; // Admin share in USD for corresponding thresholds.
        bool isSTMX; //To define if this is an STMX or some other
    }

    /**
     * @dev Struct for defining parameters required to create a new challenge.
     */
    struct CreateChallengeParams {
        address token; // Address of the token used in the challenge.
        uint256 amountFromWallet; // Amount deducted from the creator's wallet for the challenge.
        uint256 amountFromWithdrawables; // Amount taken from the creator's withdrawable balance.
        uint256 startTime; // Challenge start time in Unix timestamp.
        uint256 endTime; // Challenge end time in Unix timestamp.
    }

    /**
     * @dev Struct for defining parameters needed for a participant to join an existing challenge.
     */
    struct JoinChallengeParams {
        uint256 challengeId; // Unique identifier for the challenge to join.
        uint256 amountFromWallet; // Amount contributed from the participant's wallet.
        uint256 amountFromWithdrawables; // Amount contributed from the participant's withdrawable balance.
    }

    /**
     * @dev Struct for defining parameters required to resolve a challenge, including winners and their profits.
     */
    struct ResolveChallengeParams {
        address[] winners; // Array of addresses representing challenge winners.
        uint256[] profits; // Profit values corresponding to each winner's reward.
    }

    /**
     *  External Methods
     */

    /**
     * @dev Function is used to create the multiple challenges and emits a `ChallengeCreated` event and calls `joinChallenge` for the challenge creator for each challenge..
     *
     * @param challenges An array of `ChallengeParams` structs containing all the necessary parameters for each challenge.
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
    ) external payable;

    /** @dev This function allows users to withdraw their available tokens from the contract. It uses the
     * nonReentrant modifier from OpenZeppelin to prevent reentrancy attacks. A `UserWithdrawn` event is
     * emitted upon a successful withdrawal.
     * @param token The address of the token to be withdrawn. Use the zero address for the native currency.
     */
    function withdraw(address token) external;

    /** @dev This function allows the backend to cancel a user's participation in a challenge, refunding their bet.
     * It can only be called by the backend and is protected against reentrancy attacks. The function checks if the
     * challenge exists and ensures that the challenge is either in the `Awaiting` or `Betting` status, implying that
     * it has not been resolved yet. Additionally, it verifies that the user has indeed placed a bet on the challenge.
     * After these checks, it calls an internal function `_cancelParticipation` to handle the logic for cancelling the
     * user's participation and processing the refund.
     * @param user The address of the user whose participation is to be cancelled.
     * @param challengeId The ID of the challenge from which the user's participation is to be cancelled.
     */
    function cancelParticipation(address user, uint256 challengeId, uint8 cancelType) external;

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
    ) external;

    /** @dev This function allows the backend to cancel a challenge if it's either awaiting resolution or still open for betting.
     * It ensures that the challenge exists and is in a cancelable state (either `Awaiting` or `Betting`). Upon cancellation,
     * the challenge's status is updated to `Canceled`, and all bets placed on the challenge are refunded to the participants.
     * This function is protected by the `onlyBackend` modifier to restrict access to the backend address, and `nonReentrant`
     * to prevent reentrancy attacks.
     * @param challengeId The ID of the challenge to be cancelled.
     * @param cancelType 0-Return bet amount without admin shares 1-Return bet amount with admin shares.
     */
    function cancelChallenge(uint256 challengeId, uint8 cancelType) external;

    /** @dev This function allows the contract owner to enable or disable betting across the platform.
     * It's a straightforward toggle that sets the `bettingAllowed` state variable based on the input.
     * Access to this function is restricted to the contract owner through the `onlyOwner` modifier from
     * OpenZeppelin's Ownable contract, ensuring that only the owner can change the betting policy.
     * @param value_ A boolean indicating whether betting should be allowed (`true`) or not (`false`).
     */
    function allowBetting(bool value_) external;

    /** @dev This function will allow the owner to toggle the apply membership values
     * @param value_ true to apply membership values and false for disable membership values
     */
    function updateApplyMembershipValues(bool value_) external;

    /** @dev Can only be called by the contract owner.
     * @param value_ The new minimum betting amount in USD.
     */
    function changeMinUSDBettingAmount(uint256 value_) external;

    /** @dev This function allows the contract owner to change the backend address to a new one.
     * Ensures the new backend address is not the zero address to prevent rendering the contract unusable.
     * The function is protected by the `onlyOwner` modifier, ensuring that only the contract owner has the authority
     * to update the backend address. This is crucial for maintaining the integrity and security of the contract's
     * administrative functions.
     * @param backend_ The new address to be set as the backend. It must be a non-zero address.
     */
    function changeBackend(address backend_) external;

    /** @dev This function is designed to adjust the timing of a challenge, allowing the backend to
     * modify the start and end times as necessary. It's particularly useful for correcting mistakes
     * or accommodating changes in event schedules. The function checks for the existence of the challenge
     * and validates that the new end time is indeed after the new start time to maintain logical consistency.
     * Access is restricted to the backend through the `onlyBackend` modifier to ensure that only authorized
     * personnel can make such adjustments.
     * @param challengeId The ID of the challenge whose timings are to be changed.
     * @param startTime The new start time for the challenge.
     * @param endTime The new end time for the challenge.
     */

    /** @dev This function enables the contract owner to restrict certain tokens from being used in betting activities.
     * It involves removing tokens from the list of allowed tokens, potentially removing them from the list of tokens
     * without a Chainlink price feed (oracless tokens), and deleting their associated price feeds if any were set.
     * This is a crucial administrative function for managing the tokens that can be used on the platform, allowing
     * for adjustments based on compliance, liquidity, or other operational considerations.
     * Execution is restricted to the contract's owner through the `onlyOwner` modifier, ensuring that token restrictions
     * can only be imposed by authorized parties.
     * @param tokens An array of token addresses that are to be restricted from use in betting.
     */
    function restrictTokens(address[] memory tokens) external;

    /** @dev Allows the contract owner to define how administrative shares (a portion of betting winnings) are calculated.
     * This can be configured differently for the STMX token versus other tokens, as indicated by the `isSTMX` flag.
     * Each entry in the `thresholds` and `percentages` arrays defines a tier: if the winnings fall into a certain threshold,
     * the corresponding percentage is applied as the administrative share. The function enforces ascending order for thresholds
     * and ensures that the share percentages do not exceed a maximum limit. This setup allows for flexible configuration
     * of administrative fees based on the amount won.
     * Access is restricted to the contract owner through the `onlyOwner` modifier, ensuring that only they can set these rules.
     * @param thresholds An array of threshold values, each representing the lower bound of a winnings bracket.
     * @param percentages An array of percentages corresponding to each threshold, defining the admin share for that bracket.
     * @param token Token address.
     * @param isSTMX A boolean flag indicating whether these rules apply to the STMX token (`true`) or other tokens (`false`).
     */
    function setAdminShareRules(
        uint256[] memory thresholds,
        uint256[] memory percentages,
        address token,
        bool isSTMX
    ) external;

    /// @notice Update the maximum challenger limits
    /**
     * Access is restricted to the contract owner through the `onlyOwner` modifier, ensuring that only they can set these rules.
     * @param _maxChallengersPerChallenge maximun limit of challengers can join for pickem.
     */
    function updateMaxChallengers(uint256 _maxChallengersPerChallenge) external;

    /**
     * Access is restricted to the contract owner through the `onlyOwner` modifier, ensuring that only owner can deposit amount to SC.
     * @param _amount amount of tokens.
     * @param _token token address.
     */
    function debitInSC(uint256 _amount, address _token) external payable;

    /** @dev This function provides external access to the administrative share rules that have been set up for either
     * the STMX token (if `isSTMX` is true) or for other tokens (if `isSTMX` is false). These rules define the thresholds
     * and corresponding percentages that determine how administrative shares are calculated from betting winnings.
     * The function returns two arrays: one for the thresholds and one for the percentages, which together outline the
     * structure of admin shares based on the amount of winnings.
     * @param token A boolean flag indicating whether to retrieve the rules for the STMX token (`true`) or other tokens (`false`).
     * @return thresholds An array of uint256 representing the winnings thresholds for admin shares calculation.
     * @return percentages An array of uint256 representing the admin share percentages for each corresponding threshold.
     */
    function getAdminShareRules(
        address token
    )
        external
        view
        returns (uint256[] memory thresholds, uint256[] memory percentages, bool isSTMX);

    /** @dev This function provides external visibility into which tokens are currently permitted for use in betting within the platform.
     * It leverages the EnumerableSet library from OpenZeppelin to handle the dynamic array of addresses representing the allowed tokens.
     * This is particularly useful for interfaces or external contracts that need to verify or display the tokens users can bet with.
     * @return An array of addresses, each representing a token that is allowed for betting.
     */
    function getAllowedTokens() external view returns (address[] memory);

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
    ) external view returns (Challenge memory challengeDetails);

    /** @dev This function allows anyone to view the details of a bet made by a user on a specific challenge,
     * including the amount bet and the side the user has chosen. It's crucial for enabling users or interfaces
     * to confirm the details of participation in challenges and to understand the stakes involved. This function
     * directly accesses the mapping of user bets based on the user address and challenge ID, returning the
     * corresponding `UserBet` struct.
     * @param challengeId The ID of the challenge for which the bet details are being queried.
     * @param user The address of the user whose bet details are requested.
     * @return A `UserBet` struct containing the amount of the bet and the decision (side chosen) by the user for the specified challenge.
     */
    function getUserBet(uint256 challengeId, address user) external view returns (UserBet memory);

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
    ) external view returns (address[] memory tokens, uint256[] memory amounts);

    /**
     * @dev This function allows a user to join an existing challenge by placing their bet.
     *      Upon successful bet placement, a `ChallengeJoined` event is emitted. The user can
     *      place a bet using their wallet balance, withdrawable balance, and specify a decision
     *      regarding the challenge outcome. Additionally, a referrer may receive a commission from the admin's share.
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
    ) external payable;

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
    ) external payable;

    /** @dev A challenge is considered to exist if its ID is greater than 0 and less than or equal to the latest challenge ID.
     * @param challengeId The ID of the challenge to check.
     * @return bool Returns true if the challenge exists, false otherwise.
     */
    function challengeExists(uint256 challengeId) external view returns (bool);

    /** @dev This function will allow the owner to update the root node of merkle tree
     * @param _root root node of merkle tree
     */
    function updateRoot(bytes32 _root) external;

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
    ) external;
}

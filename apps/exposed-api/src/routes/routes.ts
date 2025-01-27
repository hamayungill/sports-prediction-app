/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import {  fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { UsersController } from './../controllers/v1/user';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { TrackController } from './../controllers/v1/track';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { SportsController } from './../controllers/v1/sports';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { QuestController } from './../controllers/v1/quests';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { MembershipController } from './../controllers/v1/membership';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { GamesController } from './../controllers/v1/games';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ChallengesController } from './../controllers/v1/challenges';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AuthController } from './../controllers/v1/auth';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { GamesControllerV2 } from './../controllers/v2/games';
import { expressAuthentication } from './../middleware/authentication';
// @ts-ignore - no great way to install types from subpackage
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';

const expressAuthenticationRecasted = expressAuthentication as (req: ExRequest, securityName: string, scopes?: string[], res?: ExResponse) => Promise<any>;


// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "Record_string.any_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"any"},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Record_any.any_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"any"},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResponsePayload": {
        "dataType": "refObject",
        "properties": {
            "code": {"dataType":"string"},
            "data": {"ref":"Record_string.any_"},
            "message": {"dataType":"string"},
            "pagination": {"ref":"Record_any.any_"},
            "status": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse": {
        "dataType": "refObject",
        "properties": {
            "resCode": {"dataType":"double","required":true},
            "resData": {"ref":"ResponsePayload","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PatchUserBody": {
        "dataType": "refObject",
        "properties": {
            "firstName": {"dataType":"string"},
            "lastName": {"dataType":"string"},
            "nickname": {"dataType":"string"},
            "email": {"dataType":"string"},
            "uid": {"dataType":"string"},
            "handle": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Record_string.boolean_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"boolean"},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PatchUserTouAndNotif": {
        "dataType": "refObject",
        "properties": {
            "terms": {"ref":"Record_string.boolean_"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserPreference": {
        "dataType": "refObject",
        "properties": {
            "preferenceId": {"dataType":"double","required":true},
            "preferenceValue": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "trackBody": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"event":{"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"dataType":"nestedObjectLiteral","nestedProperties":{"path":{"dataType":"string","required":true}},"required":true},"name":{"dataType":"string","required":true}},"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "_36_Enums.ChallengeMode": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["OneVsOne"]},{"dataType":"enum","enums":["Group"]},{"dataType":"enum","enums":["Partial"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChallengeMode": {
        "dataType": "refAlias",
        "type": {"ref":"_36_Enums.ChallengeMode","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "_36_Enums.ChallengeType": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["Private"]},{"dataType":"enum","enums":["Public"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChallengeType": {
        "dataType": "refAlias",
        "type": {"ref":"_36_Enums.ChallengeType","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "_36_Enums.Outcome": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["Win"]},{"dataType":"enum","enums":["Lose"]},{"dataType":"enum","enums":["CancelledOrDraw"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Outcome": {
        "dataType": "refAlias",
        "type": {"ref":"_36_Enums.Outcome","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "_36_Enums.CategoryDepth": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["Pickem"]},{"dataType":"enum","enums":["DayPickem"]},{"dataType":"enum","enums":["WeekPickem"]},{"dataType":"enum","enums":["Game"]},{"dataType":"enum","enums":["Team"]},{"dataType":"enum","enums":["Player"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CategoryDepth": {
        "dataType": "refAlias",
        "type": {"ref":"_36_Enums.CategoryDepth","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "_36_Enums.ParticipantRole": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["Creator"]},{"dataType":"enum","enums":["Participant"]},{"dataType":"enum","enums":["Initiator"]},{"dataType":"enum","enums":["Initializer"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ParticipantRole": {
        "dataType": "refAlias",
        "type": {"ref":"_36_Enums.ParticipantRole","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "_36_Enums.PickemScoreMode": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["OutrightWinner"]},{"dataType":"enum","enums":["WinnerBySpread"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PickemScoreMode": {
        "dataType": "refAlias",
        "type": {"ref":"_36_Enums.PickemScoreMode","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateChallenge": {
        "dataType": "refObject",
        "properties": {
            "creatorAccountId": {"dataType":"string","required":true},
            "challengeMode": {"ref":"ChallengeMode","required":true},
            "challengeType": {"ref":"ChallengeType","required":true},
            "oddsFlag": {"dataType":"boolean","required":true},
            "challengeValueQty": {"dataType":"double","required":true},
            "participantOutcome": {"ref":"Outcome","required":true},
            "participantOdds": {"dataType":"double","required":true},
            "paidWalletAddress": {"dataType":"string","required":true},
            "transactionHash": {"dataType":"string","required":true},
            "exchangeRate": {"dataType":"double","required":true},
            "gameType": {"ref":"CategoryDepth","required":true},
            "pickem": {"dataType":"string"},
            "sportId": {"dataType":"double","required":true},
            "leagueName": {"dataType":"string","required":true},
            "homeAbbreviation": {"dataType":"string"},
            "awayAbbreviation": {"dataType":"string"},
            "winCriteria": {"dataType":"double"},
            "gameId": {"dataType":"double","required":true},
            "playerId": {"dataType":"string"},
            "teamId": {"dataType":"string"},
            "categoryId": {"dataType":"double"},
            "groupId": {"dataType":"double"},
            "subgroupId": {"dataType":"double"},
            "participantStatP1": {"dataType":"double"},
            "participantStatP2": {"dataType":"double"},
            "statAttribute": {"dataType":"string"},
            "startDate": {"dataType":"string","required":true},
            "endDate": {"dataType":"string","required":true},
            "multiTokenFlag": {"dataType":"boolean","required":true},
            "contractId": {"dataType":"double","required":true},
            "scContractId": {"dataType":"double","required":true},
            "participantRole": {"ref":"ParticipantRole","required":true},
            "participantInputQty": {"dataType":"double"},
            "pickemScoreMode": {"ref":"PickemScoreMode"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "JoinChallenge": {
        "dataType": "refObject",
        "properties": {
            "participantAccountId": {"dataType":"string","required":true},
            "paidWalletAddress": {"dataType":"string","required":true},
            "oddsFlag": {"dataType":"boolean","required":true},
            "multiTokenFlag": {"dataType":"boolean","required":true},
            "participantOutcome": {"ref":"Outcome","required":true},
            "participantOdds": {"dataType":"double","required":true},
            "participationValueQty": {"dataType":"double","required":true},
            "scChallengeId": {"dataType":"string","required":true},
            "transactionHash": {"dataType":"string","required":true},
            "challengeValueQty": {"dataType":"double","required":true},
            "participationValueUsd": {"dataType":"double","required":true},
            "exchangeRate": {"dataType":"double","required":true},
            "challengeMode": {"ref":"ChallengeMode","required":true},
            "gameType": {"ref":"CategoryDepth","required":true},
            "contractId": {"dataType":"double","required":true},
            "categoryId": {"dataType":"double"},
            "groupId": {"dataType":"double"},
            "subgroupId": {"dataType":"double"},
            "challengeGroupId": {"dataType":"double","required":true},
            "participantStatP1": {"dataType":"double"},
            "participantStatP2": {"dataType":"double"},
            "statAttribute": {"dataType":"string"},
            "participantRole": {"ref":"ParticipantRole","required":true},
            "participantInputQty": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "_36_Enums.Status": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["Active"]},{"dataType":"enum","enums":["Inactive"]},{"dataType":"enum","enums":["Restricted"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Status": {
        "dataType": "refAlias",
        "type": {"ref":"_36_Enums.Status","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpsertLineups": {
        "dataType": "refObject",
        "properties": {
            "sportId": {"dataType":"double","required":true},
            "lineupId": {"dataType":"double"},
            "challengeId": {"dataType":"double","required":true},
            "challengeResultId": {"dataType":"double","required":true},
            "pickTeamId": {"dataType":"string"},
            "spreadPoints": {"dataType":"double","required":true},
            "gameId": {"dataType":"double","required":true},
            "pickStatus": {"ref":"Status","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "_36_Enums.ChallengeStatus": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["AuthPending"]},{"dataType":"enum","enums":["Pending"]},{"dataType":"enum","enums":["Ready"]},{"dataType":"enum","enums":["InProgress"]},{"dataType":"enum","enums":["Completed"]},{"dataType":"enum","enums":["Cancelled"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChallengeStatus": {
        "dataType": "refAlias",
        "type": {"ref":"_36_Enums.ChallengeStatus","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "JoinChallengeForm": {
        "dataType": "refObject",
        "properties": {
            "scChallengeId": {"dataType":"string","required":true},
            "challengeId": {"dataType":"double","required":true},
            "walletAddress": {"dataType":"string","required":true},
            "contractId": {"dataType":"double","required":true},
            "participantOdds": {"dataType":"double","required":true},
            "participantAccountId": {"dataType":"string","required":true},
            "oddsFlag": {"dataType":"boolean","required":true},
            "multiTokenFlag": {"dataType":"boolean","required":true},
            "participationValueQty": {"dataType":"double","required":true},
            "participationValueUsd": {"dataType":"double","required":true},
            "challengeDepth": {"ref":"CategoryDepth","required":true},
            "challengeGroupId": {"dataType":"double","required":true},
            "exchangeRate": {"dataType":"double","required":true},
            "participantOutcome": {"ref":"Outcome","required":true},
            "status": {"ref":"ChallengeStatus","required":true},
            "categoryId": {"dataType":"double"},
            "groupId": {"dataType":"double"},
            "subgroupId": {"dataType":"double"},
            "participantStatP1": {"dataType":"double"},
            "participantStatP2": {"dataType":"double"},
            "statAttribute": {"dataType":"string"},
            "isReady": {"dataType":"boolean"},
            "participantRole": {"ref":"ParticipantRole","required":true},
            "challengeMode": {"ref":"ChallengeMode","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateTiebreaker": {
        "dataType": "refObject",
        "properties": {
            "challengeResultId": {"dataType":"double","required":true},
            "tiebreaker": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateChallengeType": {
        "dataType": "refObject",
        "properties": {
            "challengeId": {"dataType":"double","required":true},
            "challengeType": {"ref":"ChallengeType","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SmartContractResponse": {
        "dataType": "refObject",
        "properties": {
            "challengeId": {"dataType":"double","required":true},
            "scChallengeId": {"dataType":"string","required":true},
            "walletAddress": {"dataType":"string","required":true},
            "isScFailed": {"dataType":"boolean","required":true},
            "isJoin": {"dataType":"boolean","required":true},
            "isReadyState": {"dataType":"boolean","required":true},
            "exchangeRate": {"dataType":"double","required":true},
            "challengeValueQty": {"dataType":"double","required":true},
            "participationValueQty": {"dataType":"double","required":true},
            "transactionHash": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpsertFavorites": {
        "dataType": "refObject",
        "properties": {
            "challengeId": {"dataType":"double","required":true},
            "isFavorite": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpstakeTokenQty": {
        "dataType": "refObject",
        "properties": {
            "challengeId": {"dataType":"double","required":true},
            "scChallengeId": {"dataType":"string","required":true},
            "walletAddress": {"dataType":"string","required":true},
            "contractId": {"dataType":"double","required":true},
            "tokenUpstakeQty": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "BetTypes": {
        "dataType": "refEnum",
        "enums": ["Game","Pickem","Player","Team"],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "_36_Enums.ShareStatus": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["Cancelled"]},{"dataType":"enum","enums":["Sent"]},{"dataType":"enum","enums":["Converted"]},{"dataType":"enum","enums":["Approved"]},{"dataType":"enum","enums":["Rejected"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ShareStatus": {
        "dataType": "refAlias",
        "type": {"ref":"_36_Enums.ShareStatus","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateChallengeMode": {
        "dataType": "refObject",
        "properties": {
            "challengeMode": {"ref":"ChallengeMode","required":true},
            "shareStatus": {"ref":"ShareStatus","required":true},
            "creatorStakedQty": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SignUpMethod": {
        "dataType": "refEnum",
        "enums": ["Email","Google","X","Apple","WalletConnect","MetaMask","Coinbase Wallet"],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SignInBody": {
        "dataType": "refObject",
        "properties": {
            "email": {"dataType":"string"},
            "walletAddress": {"dataType":"string","required":true},
            "signUpMethod": {"ref":"SignUpMethod"},
            "signUpSource": {"dataType":"string"},
            "anonymousId": {"dataType":"string"},
            "nickname": {"dataType":"string"},
            "referrerCode": {"dataType":"string"},
            "inviteCode": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponseStatus.Success": {
        "dataType": "refEnum",
        "enums": ["success"],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "JsonObject": {
        "dataType": "refObject",
        "properties": {
        },
        "additionalProperties": {"ref":"JsonValue"},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "JsonValue": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"double"},{"dataType":"boolean"},{"dataType":"enum","enums":[null]},{"ref":"JsonObject"},{"ref":"JsonArray"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "JsonArray": {
        "dataType": "refAlias",
        "type": {"dataType":"array","array":{"dataType":"refAlias","ref":"JsonValue"},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SuccessResponseMeta": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"nextCursor":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true}},"additionalProperties":{"ref":"JsonValue"},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SuccessResponse": {
        "dataType": "refObject",
        "properties": {
            "status": {"ref":"ApiResponseStatus.Success","required":true},
            "data": {"dataType":"union","subSchemas":[{"ref":"JsonObject"},{"dataType":"enum","enums":[null]}],"required":true},
            "meta": {"ref":"SuccessResponseMeta"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponseStatus.Fail": {
        "dataType": "refEnum",
        "enums": ["fail"],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "FailResponse": {
        "dataType": "refObject",
        "properties": {
            "status": {"ref":"ApiResponseStatus.Fail","required":true},
            "data": {"ref":"JsonObject","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponseStatus.Error": {
        "dataType": "refEnum",
        "enums": ["error"],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ErrorResponse": {
        "dataType": "refObject",
        "properties": {
            "status": {"ref":"ApiResponseStatus.Error","required":true},
            "code": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"ref":"JsonObject"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CallerType": {
        "dataType": "refEnum",
        "enums": ["anonymous","user"],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {"noImplicitAdditionalProperties":"throw-on-extras","bodyCoercion":true});

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa




export function RegisterRoutes(app: Router) {

    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################


    
        app.get('/v1/users',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.getUsers)),

            async function UsersController_getUsers(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
                    _apppubkey: {"in":"header","name":"apppubkey","required":true,"dataType":"string"},
                    _authorizationtype: {"in":"header","name":"authorizationtype","required":true,"dataType":"string"},
                    _authorization: {"in":"header","name":"authorization","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new UsersController();

              await templateService.apiHandler({
                methodName: 'getUsers',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/users/:userId',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.getUserById)),

            async function UsersController_getUserById(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    userId: {"in":"path","name":"userId","required":true,"dataType":"string"},
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
                    _apppubkey: {"in":"header","name":"apppubkey","required":true,"dataType":"string"},
                    _authorizationtype: {"in":"header","name":"authorizationtype","required":true,"dataType":"string"},
                    _authorization: {"in":"header","name":"authorization","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new UsersController();

              await templateService.apiHandler({
                methodName: 'getUserById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.patch('/v1/users/:userId',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.patchUser)),

            async function UsersController_patchUser(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    _apppubkey: {"in":"header","name":"apppubkey","required":true,"dataType":"string"},
                    _authorizationtype: {"in":"header","name":"authorizationtype","required":true,"dataType":"string"},
                    _authorization: {"in":"header","name":"authorization","required":true,"dataType":"string"},
                    userId: {"in":"path","name":"userId","required":true,"dataType":"string"},
                    patchUserBody: {"in":"body","name":"patchUserBody","required":true,"ref":"PatchUserBody"},
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new UsersController();

              await templateService.apiHandler({
                methodName: 'patchUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/users/:userId/resend_code',
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.resendVerificationCode)),

            async function UsersController_resendVerificationCode(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    userId: {"in":"path","name":"userId","required":true,"dataType":"string"},
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
                    uid: {"in":"query","name":"uid","dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new UsersController();

              await templateService.apiHandler({
                methodName: 'resendVerificationCode',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/users/:userId/verify_email',
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.verifyUserEmail)),

            async function UsersController_verifyUserEmail(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    userId: {"in":"path","name":"userId","required":true,"dataType":"string"},
                    vc: {"in":"query","name":"vc","required":true,"dataType":"string"},
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new UsersController();

              await templateService.apiHandler({
                methodName: 'verifyUserEmail',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.patch('/v1/users/:userId/tou_notif',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.patchTouAndNotif)),

            async function UsersController_patchTouAndNotif(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    _apppubkey: {"in":"header","name":"apppubkey","required":true,"dataType":"string"},
                    _authorizationtype: {"in":"header","name":"authorizationtype","required":true,"dataType":"string"},
                    _authorization: {"in":"header","name":"authorization","required":true,"dataType":"string"},
                    userId: {"in":"path","name":"userId","required":true,"dataType":"string"},
                    patchUserBody: {"in":"body","name":"patchUserBody","required":true,"ref":"PatchUserTouAndNotif"},
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new UsersController();

              await templateService.apiHandler({
                methodName: 'patchTouAndNotif',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/users/:userId/preferences',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.getPreferences)),

            async function UsersController_getPreferences(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    _apppubkey: {"in":"header","name":"apppubkey","required":true,"dataType":"string"},
                    _authorizationtype: {"in":"header","name":"authorizationtype","required":true,"dataType":"string"},
                    _authorization: {"in":"header","name":"authorization","required":true,"dataType":"string"},
                    userId: {"in":"path","name":"userId","required":true,"dataType":"string"},
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new UsersController();

              await templateService.apiHandler({
                methodName: 'getPreferences',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.patch('/v1/users/:userId/preferences',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.updateUserPreferences)),

            async function UsersController_updateUserPreferences(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    _apppubkey: {"in":"header","name":"apppubkey","required":true,"dataType":"string"},
                    _authorizationtype: {"in":"header","name":"authorizationtype","required":true,"dataType":"string"},
                    _authorization: {"in":"header","name":"authorization","required":true,"dataType":"string"},
                    userId: {"in":"path","name":"userId","required":true,"dataType":"string"},
                    patchUserBody: {"in":"body","name":"patchUserBody","required":true,"dataType":"array","array":{"dataType":"refObject","ref":"UserPreference"}},
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new UsersController();

              await templateService.apiHandler({
                methodName: 'updateUserPreferences',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/users/referrals/stats/:userId',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.getReferralStats)),

            async function UsersController_getReferralStats(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    _apppubkey: {"in":"header","name":"apppubkey","required":true,"dataType":"string"},
                    _authorizationtype: {"in":"header","name":"authorizationtype","required":true,"dataType":"string"},
                    _authorization: {"in":"header","name":"authorization","required":true,"dataType":"string"},
                    userId: {"in":"path","name":"userId","required":true,"dataType":"string"},
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new UsersController();

              await templateService.apiHandler({
                methodName: 'getReferralStats',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/v1/track',
            ...(fetchMiddlewares<RequestHandler>(TrackController)),
            ...(fetchMiddlewares<RequestHandler>(TrackController.prototype.trackPages)),

            async function TrackController_trackPages(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
                    _requestBody: {"in":"body","name":"_requestBody","required":true,"ref":"trackBody"},
                    _caller: {"in":"header","name":"Caller","required":true,"dataType":"string"},
                    _callerId: {"in":"header","name":"Caller-Id","required":true,"dataType":"string"},
                    _userAgent: {"in":"header","name":"User-Agent","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new TrackController();

              await templateService.apiHandler({
                methodName: 'trackPages',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/v1/sports/challenges',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SportsController)),
            ...(fetchMiddlewares<RequestHandler>(SportsController.prototype.createChallenge)),

            async function SportsController_createChallenge(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"CreateChallenge"},
                    _apppubkey: {"in":"header","name":"apppubkey","required":true,"dataType":"string"},
                    _authorizationtype: {"in":"header","name":"authorizationtype","required":true,"dataType":"string"},
                    _authorization: {"in":"header","name":"authorization","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new SportsController();

              await templateService.apiHandler({
                methodName: 'createChallenge',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/v1/sports/challenges/:challengeId',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SportsController)),
            ...(fetchMiddlewares<RequestHandler>(SportsController.prototype.joinChallenge)),

            async function SportsController_joinChallenge(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"JoinChallenge"},
                    challengeId: {"in":"path","name":"challengeId","required":true,"dataType":"double"},
                    _apppubkey: {"in":"header","name":"apppubkey","required":true,"dataType":"string"},
                    _authorizationtype: {"in":"header","name":"authorizationtype","required":true,"dataType":"string"},
                    _authorization: {"in":"header","name":"authorization","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new SportsController();

              await templateService.apiHandler({
                methodName: 'joinChallenge',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.patch('/v1/sports/lineups',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SportsController)),
            ...(fetchMiddlewares<RequestHandler>(SportsController.prototype.upsertLineups)),

            async function SportsController_upsertLineups(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpsertLineups"},
                    _apppubkey: {"in":"header","name":"apppubkey","required":true,"dataType":"string"},
                    _authorizationtype: {"in":"header","name":"authorizationtype","required":true,"dataType":"string"},
                    _authorization: {"in":"header","name":"authorization","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new SportsController();

              await templateService.apiHandler({
                methodName: 'upsertLineups',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/sports',
            ...(fetchMiddlewares<RequestHandler>(SportsController)),
            ...(fetchMiddlewares<RequestHandler>(SportsController.prototype.getSports)),

            async function SportsController_getSports(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new SportsController();

              await templateService.apiHandler({
                methodName: 'getSports',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/sports/default-odds',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SportsController)),
            ...(fetchMiddlewares<RequestHandler>(SportsController.prototype.getDefaultOdds)),

            async function SportsController_getDefaultOdds(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
                    _apppubkey: {"in":"header","name":"apppubkey","required":true,"dataType":"string"},
                    _authorizationtype: {"in":"header","name":"authorizationtype","required":true,"dataType":"string"},
                    _authorization: {"in":"header","name":"authorization","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new SportsController();

              await templateService.apiHandler({
                methodName: 'getDefaultOdds',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/v1/sports/join-challenge-form',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SportsController)),
            ...(fetchMiddlewares<RequestHandler>(SportsController.prototype.joinChallengeForm)),

            async function SportsController_joinChallengeForm(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"JoinChallengeForm"},
                    _apppubkey: {"in":"header","name":"apppubkey","required":true,"dataType":"string"},
                    _authorizationtype: {"in":"header","name":"authorizationtype","required":true,"dataType":"string"},
                    _authorization: {"in":"header","name":"authorization","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new SportsController();

              await templateService.apiHandler({
                methodName: 'joinChallengeForm',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.patch('/v1/sports/tiebreaker',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SportsController)),
            ...(fetchMiddlewares<RequestHandler>(SportsController.prototype.updateTiebreaker)),

            async function SportsController_updateTiebreaker(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpdateTiebreaker"},
                    _apppubkey: {"in":"header","name":"apppubkey","required":true,"dataType":"string"},
                    _authorizationtype: {"in":"header","name":"authorizationtype","required":true,"dataType":"string"},
                    _authorization: {"in":"header","name":"authorization","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new SportsController();

              await templateService.apiHandler({
                methodName: 'updateTiebreaker',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.patch('/v1/sports/challenges/type',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SportsController)),
            ...(fetchMiddlewares<RequestHandler>(SportsController.prototype.updateChallengeType)),

            async function SportsController_updateChallengeType(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpdateChallengeType"},
                    _apppubkey: {"in":"header","name":"apppubkey","required":true,"dataType":"string"},
                    _authorizationtype: {"in":"header","name":"authorizationtype","required":true,"dataType":"string"},
                    _authorization: {"in":"header","name":"authorization","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new SportsController();

              await templateService.apiHandler({
                methodName: 'updateChallengeType',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.patch('/v1/sports/challenges/smartcontract',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SportsController)),
            ...(fetchMiddlewares<RequestHandler>(SportsController.prototype.smartContractResponse)),

            async function SportsController_smartContractResponse(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"SmartContractResponse"},
                    _apppubkey: {"in":"header","name":"apppubkey","required":true,"dataType":"string"},
                    _authorizationtype: {"in":"header","name":"authorizationtype","required":true,"dataType":"string"},
                    _authorization: {"in":"header","name":"authorization","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new SportsController();

              await templateService.apiHandler({
                methodName: 'smartContractResponse',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.patch('/v1/sports/challenges/cancel/:challengeId',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SportsController)),
            ...(fetchMiddlewares<RequestHandler>(SportsController.prototype.cancelChallenge)),

            async function SportsController_cancelChallenge(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
                    challengeId: {"in":"path","name":"challengeId","required":true,"dataType":"double"},
                    _apppubkey: {"in":"header","name":"apppubkey","required":true,"dataType":"string"},
                    _authorizationtype: {"in":"header","name":"authorizationtype","required":true,"dataType":"string"},
                    _authorization: {"in":"header","name":"authorization","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new SportsController();

              await templateService.apiHandler({
                methodName: 'cancelChallenge',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/sports/challenges/favorites',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SportsController)),
            ...(fetchMiddlewares<RequestHandler>(SportsController.prototype.getFavorites)),

            async function SportsController_getFavorites(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
                    _apppubkey: {"in":"header","name":"apppubkey","required":true,"dataType":"string"},
                    _authorizationtype: {"in":"header","name":"authorizationtype","required":true,"dataType":"string"},
                    _authorization: {"in":"header","name":"authorization","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new SportsController();

              await templateService.apiHandler({
                methodName: 'getFavorites',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.patch('/v1/sports/challenges/favorites',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SportsController)),
            ...(fetchMiddlewares<RequestHandler>(SportsController.prototype.updateFavorites)),

            async function SportsController_updateFavorites(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpsertFavorites"},
                    _apppubkey: {"in":"header","name":"apppubkey","required":true,"dataType":"string"},
                    _authorizationtype: {"in":"header","name":"authorizationtype","required":true,"dataType":"string"},
                    _authorization: {"in":"header","name":"authorization","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new SportsController();

              await templateService.apiHandler({
                methodName: 'updateFavorites',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/sports/potential-returns',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SportsController)),
            ...(fetchMiddlewares<RequestHandler>(SportsController.prototype.getPotentialReturns)),

            async function SportsController_getPotentialReturns(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
                    _apppubkey: {"in":"header","name":"apppubkey","required":true,"dataType":"string"},
                    _authorizationtype: {"in":"header","name":"authorizationtype","required":true,"dataType":"string"},
                    _authorization: {"in":"header","name":"authorization","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new SportsController();

              await templateService.apiHandler({
                methodName: 'getPotentialReturns',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.patch('/v1/sports/challenges/upstake',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SportsController)),
            ...(fetchMiddlewares<RequestHandler>(SportsController.prototype.upstakeTokenQty)),

            async function SportsController_upstakeTokenQty(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpstakeTokenQty"},
                    _apppubkey: {"in":"header","name":"apppubkey","required":true,"dataType":"string"},
                    _authorizationtype: {"in":"header","name":"authorizationtype","required":true,"dataType":"string"},
                    _authorization: {"in":"header","name":"authorization","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new SportsController();

              await templateService.apiHandler({
                methodName: 'upstakeTokenQty',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.delete('/v1/sports/challenges/:challengeId/redis',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SportsController)),
            ...(fetchMiddlewares<RequestHandler>(SportsController.prototype.removeJoinRedisKey)),

            async function SportsController_removeJoinRedisKey(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
                    challengeId: {"in":"path","name":"challengeId","required":true,"dataType":"double"},
                    _apppubkey: {"in":"header","name":"apppubkey","required":true,"dataType":"string"},
                    _authorizationtype: {"in":"header","name":"authorizationtype","required":true,"dataType":"string"},
                    _authorization: {"in":"header","name":"authorization","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new SportsController();

              await templateService.apiHandler({
                methodName: 'removeJoinRedisKey',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/sports/leagues',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SportsController)),
            ...(fetchMiddlewares<RequestHandler>(SportsController.prototype.getLeagues)),

            async function SportsController_getLeagues(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
                    _apppubkey: {"in":"header","name":"apppubkey","required":true,"dataType":"string"},
                    _authorizationtype: {"in":"header","name":"authorizationtype","required":true,"dataType":"string"},
                    _authorization: {"in":"header","name":"authorization","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new SportsController();

              await templateService.apiHandler({
                methodName: 'getLeagues',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/quests',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(QuestController)),
            ...(fetchMiddlewares<RequestHandler>(QuestController.prototype.getQuests)),

            async function QuestController_getQuests(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
                    _apppubkey: {"in":"header","name":"apppubkey","required":true,"dataType":"string"},
                    _authorizationtype: {"in":"header","name":"authorizationtype","required":true,"dataType":"string"},
                    _authorization: {"in":"header","name":"authorization","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new QuestController();

              await templateService.apiHandler({
                methodName: 'getQuests',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/quests/stats/me',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(QuestController)),
            ...(fetchMiddlewares<RequestHandler>(QuestController.prototype.getUserQuestStats)),

            async function QuestController_getUserQuestStats(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
                    _apppubkey: {"in":"header","name":"apppubkey","required":true,"dataType":"string"},
                    _authorizationtype: {"in":"header","name":"authorizationtype","required":true,"dataType":"string"},
                    _authorization: {"in":"header","name":"authorization","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new QuestController();

              await templateService.apiHandler({
                methodName: 'getUserQuestStats',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/memberships',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MembershipController)),
            ...(fetchMiddlewares<RequestHandler>(MembershipController.prototype.getMemberships)),

            async function MembershipController_getMemberships(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    _apppubkey: {"in":"header","name":"apppubkey","required":true,"dataType":"string"},
                    _authorizationtype: {"in":"header","name":"authorizationtype","required":true,"dataType":"string"},
                    _authorization: {"in":"header","name":"authorization","required":true,"dataType":"string"},
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new MembershipController();

              await templateService.apiHandler({
                methodName: 'getMemberships',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/games/active-weeks/:leagueId',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(GamesController)),
            ...(fetchMiddlewares<RequestHandler>(GamesController.prototype.getActiveWeeks)),

            async function GamesController_getActiveWeeks(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    leagueId: {"in":"path","name":"leagueId","required":true,"dataType":"string"},
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
                    _apppubkey: {"in":"header","name":"apppubkey","required":true,"dataType":"string"},
                    _authorizationtype: {"in":"header","name":"authorizationtype","required":true,"dataType":"string"},
                    _authorization: {"in":"header","name":"authorization","required":true,"dataType":"string"},
                    _betType: {"in":"query","name":"betType","required":true,"ref":"BetTypes"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new GamesController();

              await templateService.apiHandler({
                methodName: 'getActiveWeeks',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/games/:leagueId',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(GamesController)),
            ...(fetchMiddlewares<RequestHandler>(GamesController.prototype.getGamesByLeagueId)),

            async function GamesController_getGamesByLeagueId(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    leagueId: {"in":"path","name":"leagueId","required":true,"dataType":"string"},
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
                    _apppubkey: {"in":"header","name":"apppubkey","required":true,"dataType":"string"},
                    _authorizationtype: {"in":"header","name":"authorizationtype","required":true,"dataType":"string"},
                    _authorization: {"in":"header","name":"authorization","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new GamesController();

              await templateService.apiHandler({
                methodName: 'getGamesByLeagueId',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/games/challenges/:inviteCode',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(GamesController)),
            ...(fetchMiddlewares<RequestHandler>(GamesController.prototype.getGamesInChallenge)),

            async function GamesController_getGamesInChallenge(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    inviteCode: {"in":"path","name":"inviteCode","required":true,"dataType":"string"},
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
                    _apppubkey: {"in":"header","name":"apppubkey","required":true,"dataType":"string"},
                    _authorizationtype: {"in":"header","name":"authorizationtype","required":true,"dataType":"string"},
                    _authorization: {"in":"header","name":"authorization","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new GamesController();

              await templateService.apiHandler({
                methodName: 'getGamesInChallenge',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/games/players/leagues/:leagueId',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(GamesController)),
            ...(fetchMiddlewares<RequestHandler>(GamesController.prototype.getPlayersInTeam)),

            async function GamesController_getPlayersInTeam(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    leagueId: {"in":"path","name":"leagueId","required":true,"dataType":"string"},
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
                    _apppubkey: {"in":"header","name":"apppubkey","required":true,"dataType":"string"},
                    _authorizationtype: {"in":"header","name":"authorizationtype","required":true,"dataType":"string"},
                    _authorization: {"in":"header","name":"authorization","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new GamesController();

              await templateService.apiHandler({
                methodName: 'getPlayersInTeam',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/challenges/public',
            ...(fetchMiddlewares<RequestHandler>(ChallengesController)),
            ...(fetchMiddlewares<RequestHandler>(ChallengesController.prototype.listPublicChallenges)),

            async function ChallengesController_listPublicChallenges(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new ChallengesController();

              await templateService.apiHandler({
                methodName: 'listPublicChallenges',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/challenges/contracts',
            ...(fetchMiddlewares<RequestHandler>(ChallengesController)),
            ...(fetchMiddlewares<RequestHandler>(ChallengesController.prototype.getContracts)),

            async function ChallengesController_getContracts(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
                    _apppubkey: {"in":"header","name":"apppubkey","required":true,"dataType":"string"},
                    _authorizationtype: {"in":"header","name":"authorizationtype","required":true,"dataType":"string"},
                    _authorization: {"in":"header","name":"authorization","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new ChallengesController();

              await templateService.apiHandler({
                methodName: 'getContracts',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/challenges/:inviteCode/metrics/:userId',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ChallengesController)),
            ...(fetchMiddlewares<RequestHandler>(ChallengesController.prototype.getChallengeMetrics)),

            async function ChallengesController_getChallengeMetrics(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    inviteCode: {"in":"path","name":"inviteCode","required":true,"dataType":"string"},
                    userId: {"in":"path","name":"userId","required":true,"dataType":"string"},
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new ChallengesController();

              await templateService.apiHandler({
                methodName: 'getChallengeMetrics',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/challenges/:inviteCode/lineups/:challengeResultId',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ChallengesController)),
            ...(fetchMiddlewares<RequestHandler>(ChallengesController.prototype.getPickemChallengeLineups)),

            async function ChallengesController_getPickemChallengeLineups(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    inviteCode: {"in":"path","name":"inviteCode","required":true,"dataType":"string"},
                    challengeResultId: {"in":"path","name":"challengeResultId","required":true,"dataType":"string"},
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new ChallengesController();

              await templateService.apiHandler({
                methodName: 'getPickemChallengeLineups',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/challenges/requests',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ChallengesController)),
            ...(fetchMiddlewares<RequestHandler>(ChallengesController.prototype.getPartialBetEvents)),

            async function ChallengesController_getPartialBetEvents(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
                    _apppubkey: {"in":"header","name":"apppubkey","required":true,"dataType":"string"},
                    _authorizationtype: {"in":"header","name":"authorizationtype","required":true,"dataType":"string"},
                    _authorization: {"in":"header","name":"authorization","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new ChallengesController();

              await templateService.apiHandler({
                methodName: 'getPartialBetEvents',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/challenges/:userId',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ChallengesController)),
            ...(fetchMiddlewares<RequestHandler>(ChallengesController.prototype.getUserChallenges)),

            async function ChallengesController_getUserChallenges(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    userId: {"in":"path","name":"userId","required":true,"dataType":"string"},
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
                    _apppubkey: {"in":"header","name":"apppubkey","required":true,"dataType":"string"},
                    _authorizationtype: {"in":"header","name":"authorizationtype","required":true,"dataType":"string"},
                    _authorization: {"in":"header","name":"authorization","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new ChallengesController();

              await templateService.apiHandler({
                methodName: 'getUserChallenges',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.patch('/v1/challenges/:challengeId/requests',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ChallengesController)),
            ...(fetchMiddlewares<RequestHandler>(ChallengesController.prototype.updateChallengeMode)),

            async function ChallengesController_updateChallengeMode(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    challengeId: {"in":"path","name":"challengeId","required":true,"dataType":"string"},
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpdateChallengeMode"},
                    _apppubkey: {"in":"header","name":"apppubkey","required":true,"dataType":"string"},
                    _authorizationtype: {"in":"header","name":"authorizationtype","required":true,"dataType":"string"},
                    _authorization: {"in":"header","name":"authorization","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new ChallengesController();

              await templateService.apiHandler({
                methodName: 'updateChallengeMode',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/challenges/:inviteCode/participants',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ChallengesController)),
            ...(fetchMiddlewares<RequestHandler>(ChallengesController.prototype.getChallengeParticipants)),

            async function ChallengesController_getChallengeParticipants(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    inviteCode: {"in":"path","name":"inviteCode","required":true,"dataType":"string"},
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
                    _apppubkey: {"in":"header","name":"apppubkey","required":true,"dataType":"string"},
                    _authorizationtype: {"in":"header","name":"authorizationtype","required":true,"dataType":"string"},
                    _authorization: {"in":"header","name":"authorization","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new ChallengesController();

              await templateService.apiHandler({
                methodName: 'getChallengeParticipants',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/challenges/:inviteCode/leaderboard/:challengeResultId',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ChallengesController)),
            ...(fetchMiddlewares<RequestHandler>(ChallengesController.prototype.getChallengeLeaderboard)),

            async function ChallengesController_getChallengeLeaderboard(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    inviteCode: {"in":"path","name":"inviteCode","required":true,"dataType":"string"},
                    challengeResultId: {"in":"path","name":"challengeResultId","required":true,"dataType":"string"},
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new ChallengesController();

              await templateService.apiHandler({
                methodName: 'getChallengeLeaderboard',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/challenges/leagues/:leagueId',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ChallengesController)),
            ...(fetchMiddlewares<RequestHandler>(ChallengesController.prototype.getPublicChallenges)),

            async function ChallengesController_getPublicChallenges(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    leagueId: {"in":"path","name":"leagueId","required":true,"dataType":"string"},
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new ChallengesController();

              await templateService.apiHandler({
                methodName: 'getPublicChallenges',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/challenges/categories/games/:gameId',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ChallengesController)),
            ...(fetchMiddlewares<RequestHandler>(ChallengesController.prototype.getCategoriesInGame)),

            async function ChallengesController_getCategoriesInGame(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    gameId: {"in":"path","name":"gameId","required":true,"dataType":"string"},
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new ChallengesController();

              await templateService.apiHandler({
                methodName: 'getCategoriesInGame',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/challenges/categories/:categoryId/groups',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ChallengesController)),
            ...(fetchMiddlewares<RequestHandler>(ChallengesController.prototype.getGroupsInCategory)),

            async function ChallengesController_getGroupsInCategory(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    categoryId: {"in":"path","name":"categoryId","required":true,"dataType":"string"},
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new ChallengesController();

              await templateService.apiHandler({
                methodName: 'getGroupsInCategory',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/challenges/groups/:groupId/subgroups',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ChallengesController)),
            ...(fetchMiddlewares<RequestHandler>(ChallengesController.prototype.getSubgroupsInGroups)),

            async function ChallengesController_getSubgroupsInGroups(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    groupId: {"in":"path","name":"groupId","required":true,"dataType":"string"},
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new ChallengesController();

              await templateService.apiHandler({
                methodName: 'getSubgroupsInGroups',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/v1/auth/sign_in',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.signIn)),

            async function AuthController_signIn(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"SignInBody"},
                    _apppubkey: {"in":"header","name":"apppubkey","required":true,"dataType":"string"},
                    _authorizationtype: {"in":"header","name":"authorizationtype","required":true,"dataType":"string"},
                    _authorization: {"in":"header","name":"authorization","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'signIn',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/v1/auth/sign_out',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.signOut)),

            async function AuthController_signOut(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
                    _apppubkey: {"in":"header","name":"apppubkey","required":true,"dataType":"string"},
                    _authorizationtype: {"in":"header","name":"authorizationtype","required":true,"dataType":"string"},
                    authorization: {"in":"header","name":"authorization","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'signOut',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v2/games',
            ...(fetchMiddlewares<RequestHandler>(GamesControllerV2)),
            ...(fetchMiddlewares<RequestHandler>(GamesControllerV2.prototype.getGames)),

            async function GamesControllerV2_getGames(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
                    correlationId: {"in":"header","name":"Correlation-Id","required":true,"dataType":"string"},
                    caller: {"in":"header","name":"Caller","required":true,"ref":"CallerType"},
                    callerId: {"in":"header","name":"Caller-Id","required":true,"dataType":"string"},
                    filter: {"in":"query","name":"filter","dataType":"string"},
                    sort: {"in":"query","name":"sort","dataType":"string"},
                    limit: {"in":"query","name":"limit","dataType":"double"},
                    cursor: {"in":"query","name":"cursor","dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new GamesControllerV2();

              await templateService.apiHandler({
                methodName: 'getGames',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function authenticateMiddleware(security: TsoaRoute.Security[] = []) {
        return async function runAuthenticationMiddleware(request: any, response: any, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            // keep track of failed auth attempts so we can hand back the most
            // recent one.  This behavior was previously existing so preserving it
            // here
            const failedAttempts: any[] = [];
            const pushAndRethrow = (error: any) => {
                failedAttempts.push(error);
                throw error;
            };

            const secMethodOrPromises: Promise<any>[] = [];
            for (const secMethod of security) {
                if (Object.keys(secMethod).length > 1) {
                    const secMethodAndPromises: Promise<any>[] = [];

                    for (const name in secMethod) {
                        secMethodAndPromises.push(
                            expressAuthenticationRecasted(request, name, secMethod[name], response)
                                .catch(pushAndRethrow)
                        );
                    }

                    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

                    secMethodOrPromises.push(Promise.all(secMethodAndPromises)
                        .then(users => { return users[0]; }));
                } else {
                    for (const name in secMethod) {
                        secMethodOrPromises.push(
                            expressAuthenticationRecasted(request, name, secMethod[name], response)
                                .catch(pushAndRethrow)
                        );
                    }
                }
            }

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            try {
                request['user'] = await Promise.any(secMethodOrPromises);

                // Response was sent in middleware, abort
                if (response.writableEnded) {
                    return;
                }

                next();
            }
            catch(err) {
                // Show most recent error as response
                const error = failedAttempts.pop();
                error.status = error.status || 401;

                // Response was sent in middleware, abort
                if (response.writableEnded) {
                    return;
                }
                next(error);
            }

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        }
    }

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

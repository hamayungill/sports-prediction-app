/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import {  fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { SportsController } from './../controller/sports';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { QuestController } from './../controller/quests';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { GamesController } from './../controller/games';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ChallengesController } from './../controller/challenges';
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';



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
};
const templateService = new ExpressTemplateService(models, {"noImplicitAdditionalProperties":"throw-on-extras","bodyCoercion":true});

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa




export function RegisterRoutes(app: Router) {

    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################


    
        app.post('/v1/sports/challenges',
            ...(fetchMiddlewares<RequestHandler>(SportsController)),
            ...(fetchMiddlewares<RequestHandler>(SportsController.prototype.createChallenge)),

            async function SportsController_createChallenge(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"CreateChallenge"},
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
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
            ...(fetchMiddlewares<RequestHandler>(SportsController)),
            ...(fetchMiddlewares<RequestHandler>(SportsController.prototype.joinChallenge)),

            async function SportsController_joinChallenge(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"JoinChallenge"},
                    challengeId: {"in":"path","name":"challengeId","required":true,"dataType":"double"},
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
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
            ...(fetchMiddlewares<RequestHandler>(SportsController)),
            ...(fetchMiddlewares<RequestHandler>(SportsController.prototype.upsertLineups)),

            async function SportsController_upsertLineups(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpsertLineups"},
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
            ...(fetchMiddlewares<RequestHandler>(SportsController)),
            ...(fetchMiddlewares<RequestHandler>(SportsController.prototype.getDefaultOdds)),

            async function SportsController_getDefaultOdds(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
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
            ...(fetchMiddlewares<RequestHandler>(SportsController)),
            ...(fetchMiddlewares<RequestHandler>(SportsController.prototype.joinChallengeForm)),

            async function SportsController_joinChallengeForm(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"JoinChallengeForm"},
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
            ...(fetchMiddlewares<RequestHandler>(SportsController)),
            ...(fetchMiddlewares<RequestHandler>(SportsController.prototype.updateTiebreaker)),

            async function SportsController_updateTiebreaker(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpdateTiebreaker"},
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
            ...(fetchMiddlewares<RequestHandler>(SportsController)),
            ...(fetchMiddlewares<RequestHandler>(SportsController.prototype.updateChallengeType)),

            async function SportsController_updateChallengeType(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpdateChallengeType"},
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
            ...(fetchMiddlewares<RequestHandler>(SportsController)),
            ...(fetchMiddlewares<RequestHandler>(SportsController.prototype.smartContractResponse)),

            async function SportsController_smartContractResponse(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"SmartContractResponse"},
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
            ...(fetchMiddlewares<RequestHandler>(SportsController)),
            ...(fetchMiddlewares<RequestHandler>(SportsController.prototype.cancelChallenge)),

            async function SportsController_cancelChallenge(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    challengeId: {"in":"path","name":"challengeId","required":true,"dataType":"double"},
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
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
            ...(fetchMiddlewares<RequestHandler>(SportsController)),
            ...(fetchMiddlewares<RequestHandler>(SportsController.prototype.getFavorites)),

            async function SportsController_getFavorites(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
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
            ...(fetchMiddlewares<RequestHandler>(SportsController)),
            ...(fetchMiddlewares<RequestHandler>(SportsController.prototype.updateFavorites)),

            async function SportsController_updateFavorites(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpsertFavorites"},
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
            ...(fetchMiddlewares<RequestHandler>(SportsController)),
            ...(fetchMiddlewares<RequestHandler>(SportsController.prototype.getPotentialReturns)),

            async function SportsController_getPotentialReturns(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
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
            ...(fetchMiddlewares<RequestHandler>(SportsController)),
            ...(fetchMiddlewares<RequestHandler>(SportsController.prototype.upstakeTokenQty)),

            async function SportsController_upstakeTokenQty(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpstakeTokenQty"},
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
            ...(fetchMiddlewares<RequestHandler>(SportsController)),
            ...(fetchMiddlewares<RequestHandler>(SportsController.prototype.removeJoinRedisKey)),

            async function SportsController_removeJoinRedisKey(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    challengeId: {"in":"path","name":"challengeId","required":true,"dataType":"double"},
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
            ...(fetchMiddlewares<RequestHandler>(SportsController)),
            ...(fetchMiddlewares<RequestHandler>(SportsController.prototype.getLeagues)),

            async function SportsController_getLeagues(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
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
            ...(fetchMiddlewares<RequestHandler>(QuestController)),
            ...(fetchMiddlewares<RequestHandler>(QuestController.prototype.getQuests)),

            async function QuestController_getQuests(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
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
            ...(fetchMiddlewares<RequestHandler>(QuestController)),
            ...(fetchMiddlewares<RequestHandler>(QuestController.prototype.getUserQuestStats)),

            async function QuestController_getUserQuestStats(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
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
        app.get('/v1/games/active-weeks/:leagueId',
            ...(fetchMiddlewares<RequestHandler>(GamesController)),
            ...(fetchMiddlewares<RequestHandler>(GamesController.prototype.getActiveWeeks)),

            async function GamesController_getActiveWeeks(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    leagueId: {"in":"path","name":"leagueId","required":true,"dataType":"string"},
                    betType: {"in":"query","name":"betType","dataType":"string"},
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
            ...(fetchMiddlewares<RequestHandler>(GamesController)),
            ...(fetchMiddlewares<RequestHandler>(GamesController.prototype.getGames)),

            async function GamesController_getGames(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    leagueId: {"in":"path","name":"leagueId","required":true,"dataType":"string"},
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new GamesController();

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
        app.get('/v1/games/challenges/:inviteCode',
            ...(fetchMiddlewares<RequestHandler>(GamesController)),
            ...(fetchMiddlewares<RequestHandler>(GamesController.prototype.getGamesInChallenge)),

            async function GamesController_getGamesInChallenge(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    inviteCode: {"in":"path","name":"inviteCode","required":true,"dataType":"string"},
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
            ...(fetchMiddlewares<RequestHandler>(GamesController)),
            ...(fetchMiddlewares<RequestHandler>(GamesController.prototype.getPlayersInTeam)),

            async function GamesController_getPlayersInTeam(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    leagueId: {"in":"path","name":"leagueId","required":true,"dataType":"string"},
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
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
            ...(fetchMiddlewares<RequestHandler>(ChallengesController)),
            ...(fetchMiddlewares<RequestHandler>(ChallengesController.prototype.getChallengeMetrics)),

            async function ChallengesController_getChallengeMetrics(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    inviteCode: {"in":"path","name":"inviteCode","required":true,"dataType":"string"},
                    userId: {"in":"path","name":"userId","required":true,"dataType":"string"},
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
            ...(fetchMiddlewares<RequestHandler>(ChallengesController)),
            ...(fetchMiddlewares<RequestHandler>(ChallengesController.prototype.getPickemChallengeLineups)),

            async function ChallengesController_getPickemChallengeLineups(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    inviteCode: {"in":"path","name":"inviteCode","required":true,"dataType":"string"},
                    challengeResultId: {"in":"path","name":"challengeResultId","required":true,"dataType":"string"},
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
            ...(fetchMiddlewares<RequestHandler>(ChallengesController)),
            ...(fetchMiddlewares<RequestHandler>(ChallengesController.prototype.getPartialBetEvents)),

            async function ChallengesController_getPartialBetEvents(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
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
            ...(fetchMiddlewares<RequestHandler>(ChallengesController)),
            ...(fetchMiddlewares<RequestHandler>(ChallengesController.prototype.getUserChallenges)),

            async function ChallengesController_getUserChallenges(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    userId: {"in":"path","name":"userId","required":true,"dataType":"string"},
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
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
            ...(fetchMiddlewares<RequestHandler>(ChallengesController)),
            ...(fetchMiddlewares<RequestHandler>(ChallengesController.prototype.updateChallengeMode)),

            async function ChallengesController_updateChallengeMode(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    challengeId: {"in":"path","name":"challengeId","required":true,"dataType":"string"},
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpdateChallengeMode"},
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
            ...(fetchMiddlewares<RequestHandler>(ChallengesController)),
            ...(fetchMiddlewares<RequestHandler>(ChallengesController.prototype.getChallengeParticipants)),

            async function ChallengesController_getChallengeParticipants(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    inviteCode: {"in":"path","name":"inviteCode","required":true,"dataType":"string"},
                    req: {"in":"request","name":"req","required":true,"dataType":"object"},
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
            ...(fetchMiddlewares<RequestHandler>(ChallengesController)),
            ...(fetchMiddlewares<RequestHandler>(ChallengesController.prototype.getCategoriesInGame)),

            async function ChallengesController_getCategoriesInGame(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    gameId: {"in":"path","name":"gameId","required":true,"dataType":"string"},
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
            ...(fetchMiddlewares<RequestHandler>(ChallengesController)),
            ...(fetchMiddlewares<RequestHandler>(ChallengesController.prototype.getSubgroupsInGroups)),

            async function ChallengesController_getSubgroupsInGroups(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    groupId: {"in":"path","name":"groupId","required":true,"dataType":"string"},
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

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

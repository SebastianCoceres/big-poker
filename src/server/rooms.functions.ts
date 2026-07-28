import { createServerFn } from "@tanstack/react-start";
import type { CardValue } from "#/lib/fibonacci";
import {
	castVote,
	closeResult,
	closeRoom,
	createRoom,
	joinRoom,
	kickParticipant,
	leaveRoom,
	reveal,
	startRound,
} from "#/server/rooms.server";

function requireString(value: unknown, field: string): string {
	if (typeof value !== "string") throw new Error(`${field} must be a string`);
	return value;
}

function requireCardValue(value: unknown): CardValue {
	if (typeof value !== "string" && typeof value !== "number") {
		throw new Error("card must be a string or number");
	}
	// Membership in the Fibonacci scale / special cards is a business rule,
	// not a shape check — validated inside castVote() (-> INVALID_VOTE).
	return value as CardValue;
}

function optionalString(value: unknown, field: string): string | undefined {
	if (value === undefined) return undefined;
	return requireString(value, field);
}

export const createRoomFn = createServerFn({ method: "POST" })
	.validator((data: { name: string }) => ({
		name: requireString(data.name, "name"),
	}))
	.handler(async ({ data }) => createRoom(data.name));

export const joinRoomFn = createServerFn({ method: "POST" })
	.validator(
		(data: { code: string; name: string; participantId?: string }) => ({
			code: requireString(data.code, "code"),
			name: requireString(data.name, "name"),
			participantId: optionalString(data.participantId, "participantId"),
		}),
	)
	.handler(async ({ data }) =>
		joinRoom(data.code, data.name, data.participantId),
	);

export const startRoundFn = createServerFn({ method: "POST" })
	.validator(
		(data: { code: string; participantId: string; question: string }) => ({
			code: requireString(data.code, "code"),
			participantId: requireString(data.participantId, "participantId"),
			question: requireString(data.question, "question"),
		}),
	)
	.handler(async ({ data }) =>
		startRound(data.code, data.participantId, data.question),
	);

export const castVoteFn = createServerFn({ method: "POST" })
	.validator(
		(data: {
			code: string;
			participantId: string;
			roundId: string;
			card: unknown;
		}) => ({
			code: requireString(data.code, "code"),
			participantId: requireString(data.participantId, "participantId"),
			roundId: requireString(data.roundId, "roundId"),
			card: requireCardValue(data.card),
		}),
	)
	.handler(async ({ data }) =>
		castVote(data.code, data.participantId, data.roundId, data.card),
	);

export const revealFn = createServerFn({ method: "POST" })
	.validator((data: { code: string; participantId: string }) => ({
		code: requireString(data.code, "code"),
		participantId: requireString(data.participantId, "participantId"),
	}))
	.handler(async ({ data }) => reveal(data.code, data.participantId));

export const closeResultFn = createServerFn({ method: "POST" })
	.validator((data: { code: string; participantId: string }) => ({
		code: requireString(data.code, "code"),
		participantId: requireString(data.participantId, "participantId"),
	}))
	.handler(async ({ data }) => closeResult(data.code, data.participantId));

export const leaveRoomFn = createServerFn({ method: "POST" })
	.validator((data: { code: string; participantId: string }) => ({
		code: requireString(data.code, "code"),
		participantId: requireString(data.participantId, "participantId"),
	}))
	.handler(async ({ data }) => leaveRoom(data.code, data.participantId));

export const closeRoomFn = createServerFn({ method: "POST" })
	.validator((data: { code: string; participantId: string }) => ({
		code: requireString(data.code, "code"),
		participantId: requireString(data.participantId, "participantId"),
	}))
	.handler(async ({ data }) => closeRoom(data.code, data.participantId));

export const kickParticipantFn = createServerFn({ method: "POST" })
	.validator(
		(data: { code: string; participantId: string; targetId: string }) => ({
			code: requireString(data.code, "code"),
			participantId: requireString(data.participantId, "participantId"),
			targetId: requireString(data.targetId, "targetId"),
		}),
	)
	.handler(async ({ data }) =>
		kickParticipant(data.code, data.participantId, data.targetId),
	);

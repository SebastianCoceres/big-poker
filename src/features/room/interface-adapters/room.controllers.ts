import { createServerFn } from "@tanstack/react-start";
import type { CardValue } from "../domain/voting";
import { container } from "../infrastructure/container";

function requireString(value: unknown, field: string): string {
	if (typeof value !== "string") throw new Error(`${field} must be a string`);
	return value;
}

function requireCardValue(value: unknown): CardValue {
	if (typeof value !== "string" && typeof value !== "number") {
		throw new Error("card must be a string or number");
	}
	// Membership in the Fibonacci scale / special cards is a business rule,
	// not a shape check — validated inside CastVoteUseCase (-> INVALID_VOTE).
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
	.handler(async ({ data }) => container.createRoomUseCase.execute(data.name));

export const joinRoomFn = createServerFn({ method: "POST" })
	.validator(
		(data: { code: string; name: string; participantId?: string }) => ({
			code: requireString(data.code, "code"),
			name: requireString(data.name, "name"),
			participantId: optionalString(data.participantId, "participantId"),
		}),
	)
	.handler(async ({ data }) =>
		container.joinRoomUseCase.execute(data.code, data.name, data.participantId),
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
		container.startRoundUseCase.execute(
			data.code,
			data.participantId,
			data.question,
		),
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
		container.castVoteUseCase.execute(
			data.code,
			data.participantId,
			data.roundId,
			data.card,
		),
	);

export const revealFn = createServerFn({ method: "POST" })
	.validator((data: { code: string; participantId: string }) => ({
		code: requireString(data.code, "code"),
		participantId: requireString(data.participantId, "participantId"),
	}))
	.handler(async ({ data }) =>
		container.revealUseCase.execute(data.code, data.participantId),
	);

export const closeResultFn = createServerFn({ method: "POST" })
	.validator((data: { code: string; participantId: string }) => ({
		code: requireString(data.code, "code"),
		participantId: requireString(data.participantId, "participantId"),
	}))
	.handler(async ({ data }) =>
		container.closeResultUseCase.execute(data.code, data.participantId),
	);

export const leaveRoomFn = createServerFn({ method: "POST" })
	.validator((data: { code: string; participantId: string }) => ({
		code: requireString(data.code, "code"),
		participantId: requireString(data.participantId, "participantId"),
	}))
	.handler(async ({ data }) =>
		container.leaveRoomUseCase.execute(data.code, data.participantId),
	);

export const closeRoomFn = createServerFn({ method: "POST" })
	.validator((data: { code: string; participantId: string }) => ({
		code: requireString(data.code, "code"),
		participantId: requireString(data.participantId, "participantId"),
	}))
	.handler(async ({ data }) =>
		container.closeRoomUseCase.execute(data.code, data.participantId),
	);

export const kickParticipantFn = createServerFn({ method: "POST" })
	.validator(
		(data: { code: string; participantId: string; targetId: string }) => ({
			code: requireString(data.code, "code"),
			participantId: requireString(data.participantId, "participantId"),
			targetId: requireString(data.targetId, "targetId"),
		}),
	)
	.handler(async ({ data }) =>
		container.kickParticipantUseCase.execute(
			data.code,
			data.participantId,
			data.targetId,
		),
	);

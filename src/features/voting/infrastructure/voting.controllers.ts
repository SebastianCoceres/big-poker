import { createServerFn } from "@tanstack/react-start";
import { container } from "#/app/container";
import type { CardValue } from "../domain/entities";

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

function requireNumber(value: unknown, field: string): number {
	if (typeof value !== "number") throw new Error(`${field} must be a number`);
	return value;
}

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

export const selectFinalCardFn = createServerFn({ method: "POST" })
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
			card: requireNumber(data.card, "card"),
		}),
	)
	.handler(async ({ data }) =>
		container.selectFinalCardUseCase.execute(
			data.code,
			data.participantId,
			data.roundId,
			data.card,
		),
	);

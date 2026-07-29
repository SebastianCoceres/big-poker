import { createServerFn } from "@tanstack/react-start";
import { container } from "#/app/container";

function requireString(value: unknown, field: string): string {
	if (typeof value !== "string") throw new Error(`${field} must be a string`);
	return value;
}

function optionalString(value: unknown, field: string): string | undefined {
	if (value === undefined) return undefined;
	return requireString(value, field);
}

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

export const leaveRoomFn = createServerFn({ method: "POST" })
	.validator((data: { code: string; participantId: string }) => ({
		code: requireString(data.code, "code"),
		participantId: requireString(data.participantId, "participantId"),
	}))
	.handler(async ({ data }) =>
		container.leaveRoomUseCase.execute(data.code, data.participantId),
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

import { createServerFn } from "@tanstack/react-start";
import { container } from "#/app/container";

function requireString(value: unknown, field: string): string {
	if (typeof value !== "string") throw new Error(`${field} must be a string`);
	return value;
}

export const createRoomFn = createServerFn({ method: "POST" })
	.validator((data: { name: string }) => ({
		name: requireString(data.name, "name"),
	}))
	.handler(async ({ data }) => container.createRoomUseCase.execute(data.name));

export const closeRoomFn = createServerFn({ method: "POST" })
	.validator((data: { code: string; participantId: string }) => ({
		code: requireString(data.code, "code"),
		participantId: requireString(data.participantId, "participantId"),
	}))
	.handler(async ({ data }) =>
		container.closeRoomUseCase.execute(data.code, data.participantId),
	);

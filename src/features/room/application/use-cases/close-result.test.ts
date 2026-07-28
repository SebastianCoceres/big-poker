import { beforeEach, describe, expect, it } from "vitest";
import {
	createHarness,
	createTestRoom,
	mustOk,
	type RoomHarness,
} from "../../testing/room-harness";

let harness: RoomHarness;

beforeEach(() => {
	harness = createHarness();
});

describe("CloseResultUseCase", () => {
	it("requires the master", () => {
		const { code } = createTestRoom(harness);
		const { participantId } = mustOk(harness.joinRoom(code, "Fede"));
		expect(harness.closeResult(code, participantId)).toEqual({
			ok: false,
			error: "NOT_MASTER",
		});
	});

	it("is an idempotent no-op outside revealed", () => {
		const { code, masterId } = createTestRoom(harness);
		const before = mustOk(harness.closeResult(code, masterId)); // still "waiting"
		expect(before.status).toBe("waiting");
	});

	it("moves revealed -> waiting and keeps the question", () => {
		const { code, masterId } = createTestRoom(harness);
		mustOk(harness.startRound(code, masterId, "¿Cuánto esfuerzo?"));
		mustOk(harness.reveal(code, masterId));
		const after = mustOk(harness.closeResult(code, masterId));
		expect(after.status).toBe("waiting");
		expect(after.question).toBe("¿Cuánto esfuerzo?");
	});
});

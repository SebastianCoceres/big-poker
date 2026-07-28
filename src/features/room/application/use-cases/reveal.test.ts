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

describe("RevealUseCase", () => {
	it("requires the master", () => {
		const { code } = createTestRoom(harness);
		const { participantId } = mustOk(harness.joinRoom(code, "Fede"));
		expect(harness.reveal(code, participantId)).toEqual({
			ok: false,
			error: "NOT_MASTER",
		});
	});

	it("is an idempotent no-op outside voting", () => {
		const { code, masterId } = createTestRoom(harness);
		const before = mustOk(harness.reveal(code, masterId)); // called while still "waiting"
		expect(before.status).toBe("waiting");
	});

	it("moves voting -> revealed", () => {
		const { code, masterId } = createTestRoom(harness);
		mustOk(harness.startRound(code, masterId, "q"));
		const after = mustOk(harness.reveal(code, masterId));
		expect(after.status).toBe("revealed");
	});
});

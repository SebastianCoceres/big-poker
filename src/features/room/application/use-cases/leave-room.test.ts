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

describe("LeaveRoomUseCase", () => {
	it("fails for a room that doesn't exist", () => {
		expect(harness.leaveRoom("ZZZZZZ", "x")).toEqual({
			ok: false,
			error: "ROOM_NOT_FOUND",
		});
	});

	it("the master cannot leave", () => {
		const { code, masterId } = createTestRoom(harness);
		expect(harness.leaveRoom(code, masterId)).toEqual({
			ok: false,
			error: "MASTER_CANNOT_LEAVE",
		});
	});

	it("removes the participant and is idempotent on a second call", () => {
		const { code } = createTestRoom(harness);
		const { participantId } = mustOk(harness.joinRoom(code, "Fede"));
		const after = mustOk(harness.leaveRoom(code, participantId));
		expect(after.participants.some((p) => p.id === participantId)).toBe(false);
		// Already gone — still succeeds, no-op.
		expect(harness.leaveRoom(code, participantId).ok).toBe(true);
	});
});

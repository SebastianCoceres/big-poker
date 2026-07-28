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

describe("JoinRoomUseCase", () => {
	it("fails for a room that doesn't exist", () => {
		expect(harness.joinRoom("ZZZZZZ", "Fede")).toEqual({
			ok: false,
			error: "ROOM_NOT_FOUND",
		});
	});

	it("rejects an invalid name", () => {
		const { code } = createTestRoom(harness);
		expect(harness.joinRoom(code, "")).toEqual({
			ok: false,
			error: "INVALID_NAME",
		});
	});

	it("rejects a name already taken in the room, case-insensitively", () => {
		const { code } = createTestRoom(harness, "Ana");
		expect(harness.joinRoom(code, "ana")).toEqual({
			ok: false,
			error: "NAME_TAKEN",
		});
	});

	it("adds a new participant, not master", () => {
		const { code, masterId } = createTestRoom(harness);
		const { participantId, snapshot } = mustOk(harness.joinRoom(code, "Fede"));
		expect(participantId).not.toBe(masterId);
		const fede = snapshot.participants.find((p) => p.id === participantId);
		expect(fede).toMatchObject({ name: "Fede", isMaster: false });
	});

	it("is idempotent for a returning participant (same id, updates name)", () => {
		const { code } = createTestRoom(harness);
		const first = mustOk(harness.joinRoom(code, "Fede"));
		const second = mustOk(
			harness.joinRoom(code, "Federico", first.participantId),
		);
		expect(second.participantId).toBe(first.participantId);
		expect(second.snapshot.participants).toHaveLength(2);
		const fede = second.snapshot.participants.find(
			(p) => p.id === first.participantId,
		);
		expect(fede?.name).toBe("Federico");
	});
});

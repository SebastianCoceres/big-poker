import { beforeEach, describe, expect, it } from "vitest";
import {
	createHarness,
	createTestRoom,
	mustOk,
	type RoomHarness,
} from "#/app/testing/room-harness";

let harness: RoomHarness;

beforeEach(() => {
	harness = createHarness();
});

describe("StartRoundUseCase", () => {
	it("fails for a room that doesn't exist", () => {
		expect(harness.startRound("ZZZZZZ", "x", "q")).toEqual({
			ok: false,
			error: "ROOM_NOT_FOUND",
		});
	});

	it("requires the master", () => {
		const { code } = createTestRoom(harness);
		const { participantId } = mustOk(harness.joinRoom(code, "Fede"));
		expect(
			harness.startRound(code, participantId, "¿Cuánto esfuerzo?"),
		).toEqual({
			ok: false,
			error: "NOT_MASTER",
		});
	});

	it("rejects an invalid question", () => {
		const { code, masterId } = createTestRoom(harness);
		expect(harness.startRound(code, masterId, "")).toEqual({
			ok: false,
			error: "INVALID_QUESTION",
		});
	});

	it("sets question, status voting, a fresh roundId, and clears votes", () => {
		const { code, masterId } = createTestRoom(harness);
		const before = mustOk(
			harness.startRound(code, masterId, "¿Cuánto esfuerzo?"),
		);
		expect(before.status).toBe("voting");
		expect(before.question).toBe("¿Cuánto esfuerzo?");

		mustOk(harness.castVote(code, masterId, before.roundId, 5));
		const after = mustOk(harness.startRound(code, masterId, "Otra pregunta"));
		expect(after.roundId).not.toBe(before.roundId);
		expect(after.participants.every((p) => !p.hasVoted)).toBe(true);
	});
});

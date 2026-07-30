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

describe("CastVoteUseCase", () => {
	it("fails for a room that doesn't exist", () => {
		expect(harness.castVote("ZZZZZZ", "x", "round", 5)).toEqual({
			ok: false,
			error: "ROOM_NOT_FOUND",
		});
	});

	it("rejects a vote for a stale/non-live round", () => {
		const { code, masterId } = createTestRoom(harness);
		const started = mustOk(harness.startRound(code, masterId, "q"));
		expect(
			harness.castVote(code, masterId, "not-the-real-round-id", 5),
		).toEqual({
			ok: false,
			error: "STALE_ROUND",
		});
		// Also stale once the round isn't "voting" anymore.
		mustOk(harness.reveal(code, masterId));
		expect(harness.castVote(code, masterId, started.roundId, 5)).toEqual({
			ok: false,
			error: "STALE_ROUND",
		});
	});

	it("rejects a card that isn't on the scale", () => {
		const { code, masterId } = createTestRoom(harness);
		const started = mustOk(harness.startRound(code, masterId, "q"));
		expect(
			harness.castVote(code, masterId, started.roundId, 4 as never),
		).toEqual({
			ok: false,
			error: "INVALID_VOTE",
		});
	});

	it("fails when the participant isn't seated in the room", () => {
		const { code, masterId } = createTestRoom(harness);
		const started = mustOk(harness.startRound(code, masterId, "q"));
		expect(
			harness.castVote(code, "not-a-real-participant", started.roundId, 5),
		).toEqual({
			ok: false,
			error: "ROOM_NOT_FOUND",
		});
	});

	it("records the vote and marks hasVoted for that participant only", () => {
		const { code, masterId } = createTestRoom(harness);
		const { participantId: fedeId } = mustOk(harness.joinRoom(code, "Fede"));
		const started = mustOk(harness.startRound(code, masterId, "q"));

		const after = mustOk(harness.castVote(code, masterId, started.roundId, 5));
		const master = after.participants.find((p) => p.id === masterId);
		const fede = after.participants.find((p) => p.id === fedeId);
		expect(master?.hasVoted).toBe(true);
		expect(fede?.hasVoted).toBe(false);

		// The vote itself is only visible to its own voter, and only through
		// a viewer-scoped snapshot (e.g. the one each SSE subscriber gets) —
		// castVote's own return value above isn't built for a specific
		// viewer, so it hides every vote pre-reveal, including the caller's.
		expect(master?.vote).toBeNull();
		const viewerScoped = harness.toSnapshotForCode(code, masterId);
		expect(
			viewerScoped?.participants.find((p) => p.id === masterId)?.vote,
		).toBe(5);
	});

	it("auto-reveals once every seat has voted", () => {
		const { code, masterId } = createTestRoom(harness);
		const { participantId: fedeId } = mustOk(harness.joinRoom(code, "Fede"));
		const started = mustOk(harness.startRound(code, masterId, "q"));

		mustOk(harness.castVote(code, masterId, started.roundId, 5));
		expect(harness.getRoom(code)?.status).toBe("voting");
		const after = mustOk(harness.castVote(code, fedeId, started.roundId, 8));
		expect(after.status).toBe("revealed");
	});
});

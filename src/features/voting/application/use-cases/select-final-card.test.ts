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

describe("SelectFinalCardUseCase", () => {
	it("fails for a room that doesn't exist", () => {
		expect(harness.selectFinalCard("ZZZZZZ", "x", "round", 5)).toEqual({
			ok: false,
			error: "ROOM_NOT_FOUND",
		});
	});

	it("requires the master", () => {
		const { code, masterId } = createTestRoom(harness);
		const { participantId: fedeId } = mustOk(harness.joinRoom(code, "Fede"));
		const started = mustOk(harness.startRound(code, masterId, "q"));
		mustOk(harness.castVote(code, masterId, started.roundId, 5));
		mustOk(harness.castVote(code, fedeId, started.roundId, 8));

		expect(
			harness.selectFinalCard(code, fedeId, started.roundId, 5),
		).toEqual({ ok: false, error: "NOT_MASTER" });
	});

	it("rejects a stale/non-live round", () => {
		const { code, masterId } = createTestRoom(harness);
		mustOk(harness.joinRoom(code, "Fede"));
		const started = mustOk(harness.startRound(code, masterId, "q"));
		mustOk(harness.castVote(code, masterId, started.roundId, 5));

		// Not revealed yet — Fede hasn't voted, so status is still "voting".
		expect(
			harness.selectFinalCard(code, masterId, started.roundId, 5),
		).toEqual({ ok: false, error: "STALE_ROUND" });
	});

	it("rejects a card that wasn't actually voted", () => {
		const { code, masterId } = createTestRoom(harness);
		const { participantId: fedeId } = mustOk(harness.joinRoom(code, "Fede"));
		const started = mustOk(harness.startRound(code, masterId, "q"));
		mustOk(harness.castVote(code, masterId, started.roundId, 5));
		mustOk(harness.castVote(code, fedeId, started.roundId, 8));

		expect(
			harness.selectFinalCard(code, masterId, started.roundId, 13),
		).toEqual({ ok: false, error: "INVALID_FINAL_CARD" });
	});

	it("rejects a special card even though it was voted", () => {
		const { code, masterId } = createTestRoom(harness);
		const { participantId: fedeId } = mustOk(harness.joinRoom(code, "Fede"));
		const started = mustOk(harness.startRound(code, masterId, "q"));
		mustOk(harness.castVote(code, masterId, started.roundId, "?"));
		mustOk(harness.castVote(code, fedeId, started.roundId, 8));

		expect(
			harness.selectFinalCard(code, masterId, started.roundId, "?" as never),
		).toEqual({ ok: false, error: "INVALID_FINAL_CARD" });
	});

	it("lets the master pick one of the actually-voted cards, visible to everyone", () => {
		const { code, masterId } = createTestRoom(harness);
		const { participantId: fedeId } = mustOk(harness.joinRoom(code, "Fede"));
		const started = mustOk(harness.startRound(code, masterId, "q"));
		mustOk(harness.castVote(code, masterId, started.roundId, 8));
		mustOk(harness.castVote(code, fedeId, started.roundId, 5));

		const after = mustOk(
			harness.selectFinalCard(code, masterId, started.roundId, 5),
		);
		expect(after.finalCard).toBe(5);

		const viewerScoped = harness.toSnapshotForCode(code, fedeId);
		expect(viewerScoped?.finalCard).toBe(5);
	});
});

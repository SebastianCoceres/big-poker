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

describe("KickParticipantUseCase", () => {
	it("requires the master", () => {
		const { code } = createTestRoom(harness);
		const { participantId: fedeId } = mustOk(harness.joinRoom(code, "Fede"));
		const { participantId: anaId } = mustOk(harness.joinRoom(code, "Ana"));
		expect(harness.kickParticipant(code, fedeId, anaId)).toEqual({
			ok: false,
			error: "NOT_MASTER",
		});
	});

	it("the master cannot kick themselves", () => {
		const { code, masterId } = createTestRoom(harness);
		expect(harness.kickParticipant(code, masterId, masterId)).toEqual({
			ok: false,
			error: "CANNOT_KICK_SELF",
		});
	});

	it("removes the target participant", () => {
		const { code, masterId } = createTestRoom(harness);
		const { participantId: fedeId } = mustOk(harness.joinRoom(code, "Fede"));
		const after = mustOk(harness.kickParticipant(code, masterId, fedeId));
		expect(after.participants.some((p) => p.id === fedeId)).toBe(false);
	});

	it("is idempotent when the target is already gone", () => {
		const { code, masterId } = createTestRoom(harness);
		const { participantId: fedeId } = mustOk(harness.joinRoom(code, "Fede"));
		mustOk(harness.kickParticipant(code, masterId, fedeId));
		// Already gone — still succeeds, no-op.
		expect(harness.kickParticipant(code, masterId, fedeId).ok).toBe(true);
	});

	// This is the ordering guarantee the client's own-seat-missing rejoin
	// effect depends on: the kicked participant must receive "kicked" and
	// never another "snapshot" without themselves in it, or their own tab
	// would silently rejoin and undo the kick.
	it("notifies the kicked participant directly and never sends them another snapshot", () => {
		const { code, masterId } = createTestRoom(harness);
		const { participantId: fedeId } = mustOk(harness.joinRoom(code, "Fede"));

		const masterEvents: string[] = [];
		const fedeEvents: string[] = [];
		harness.subscribe(code, masterId, (event) => masterEvents.push(event));
		harness.subscribe(code, fedeId, (event) => fedeEvents.push(event));
		masterEvents.length = 0;
		fedeEvents.length = 0; // ignore the initial subscribe-triggered broadcast

		mustOk(harness.kickParticipant(code, masterId, fedeId));

		expect(fedeEvents).toEqual(["kicked"]);
		expect(masterEvents).toContain("snapshot");
	});
});

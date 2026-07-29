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

describe("CloseRoomUseCase", () => {
	it("requires the master", () => {
		const { code } = createTestRoom(harness);
		const { participantId } = mustOk(harness.joinRoom(code, "Fede"));
		expect(harness.closeRoom(code, participantId)).toEqual({
			ok: false,
			error: "NOT_MASTER",
		});
	});

	it("notifies every subscriber and removes the room", () => {
		const { code, masterId } = createTestRoom(harness);
		const { participantId: fedeId } = mustOk(harness.joinRoom(code, "Fede"));

		const masterEvents: string[] = [];
		const fedeEvents: string[] = [];
		harness.subscribe(code, masterId, (event) => masterEvents.push(event));
		harness.subscribe(code, fedeId, (event) => fedeEvents.push(event));
		masterEvents.length = 0;
		fedeEvents.length = 0;

		const result = harness.closeRoom(code, masterId);
		expect(result).toEqual({ ok: true, data: true });
		expect(masterEvents).toContain("closed");
		expect(fedeEvents).toContain("closed");
		expect(harness.getRoom(code)).toBeUndefined();
	});
});

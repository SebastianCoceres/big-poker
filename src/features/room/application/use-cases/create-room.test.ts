import { beforeEach, describe, expect, it } from "vitest";
import {
	createHarness,
	mustOk,
	type RoomHarness,
} from "#/app/testing/room-harness";

let harness: RoomHarness;

beforeEach(() => {
	harness = createHarness();
});

describe("CreateRoomUseCase", () => {
	it("rejects an invalid name", () => {
		expect(harness.createRoom("")).toEqual({
			ok: false,
			error: "INVALID_NAME",
		});
		expect(harness.createRoom("   ")).toEqual({
			ok: false,
			error: "INVALID_NAME",
		});
		expect(harness.createRoom("a".repeat(31))).toEqual({
			ok: false,
			error: "INVALID_NAME",
		});
	});

	it("creates a room with the creator as master, status waiting", () => {
		const { snapshot, participantId } = mustOk(harness.createRoom("Ana"));
		expect(snapshot.status).toBe("waiting");
		expect(snapshot.masterId).toBe(participantId);
		expect(snapshot.participants).toEqual([
			expect.objectContaining({
				id: participantId,
				name: "Ana",
				isMaster: true,
			}),
		]);
	});
});

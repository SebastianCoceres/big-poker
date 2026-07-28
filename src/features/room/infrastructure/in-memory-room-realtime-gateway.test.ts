import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createHarness,
	createTestRoom,
	mustOk,
	type RoomHarness,
} from "../testing/room-harness";

let harness: RoomHarness;

beforeEach(() => {
	harness = createHarness();
});

describe("InMemoryRoomRealtimeGateway connection tracking", () => {
	it("marks a participant disconnected immediately, then prunes them after the grace period unless they reconnect", () => {
		vi.useFakeTimers();
		try {
			const { code, masterId } = createTestRoom(harness);
			const { participantId: fedeId } = mustOk(harness.joinRoom(code, "Fede"));

			const unsubscribe = harness.subscribe(code, fedeId, () => {});
			expect(
				harness
					.toSnapshotForCode(code, masterId)
					?.participants.find((p) => p.id === fedeId)?.connected,
			).toBe(true);

			unsubscribe();
			expect(
				harness
					.toSnapshotForCode(code, masterId)
					?.participants.find((p) => p.id === fedeId)?.connected,
			).toBe(false);
			// Still seated — the grace period hasn't elapsed yet.
			expect(
				harness
					.toSnapshotForCode(code, masterId)
					?.participants.some((p) => p.id === fedeId),
			).toBe(true);

			vi.advanceTimersByTime(21_000);
			expect(
				harness
					.toSnapshotForCode(code, masterId)
					?.participants.some((p) => p.id === fedeId),
			).toBe(false);
		} finally {
			vi.useRealTimers();
		}
	});

	it("reconnecting within the grace period cancels the pending removal", () => {
		vi.useFakeTimers();
		try {
			const { code, masterId } = createTestRoom(harness);
			const { participantId: fedeId } = mustOk(harness.joinRoom(code, "Fede"));

			harness.subscribe(code, fedeId, () => {})();
			vi.advanceTimersByTime(5_000);
			harness.subscribe(code, fedeId, () => {}); // reconnects before the 20s grace elapses

			vi.advanceTimersByTime(21_000);
			expect(
				harness
					.toSnapshotForCode(code, masterId)
					?.participants.some((p) => p.id === fedeId),
			).toBe(true);
		} finally {
			vi.useRealTimers();
		}
	});
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CardValue } from "../../domain/voting";
import { computeResults, roundUpToFibonacci } from "../../domain/voting";
import { InMemoryRoomRealtimeGateway } from "../../infrastructure/in-memory-room-realtime-gateway";
import { InMemoryRoomRepository } from "../../infrastructure/in-memory-room-repository";
import type { Send } from "../ports";
import { CastVoteUseCase } from "./cast-vote";
import { CloseResultUseCase } from "./close-result";
import { CloseRoomUseCase } from "./close-room";
import { CreateRoomUseCase } from "./create-room";
import { GetRoomSnapshotUseCase } from "./get-room-snapshot";
import { JoinRoomUseCase } from "./join-room";
import { KickParticipantUseCase } from "./kick-participant";
import { LeaveRoomUseCase } from "./leave-room";
import { RevealUseCase } from "./reveal";
import { StartRoundUseCase } from "./start-round";

// Each test gets a brand-new InMemoryRoomRepository/InMemoryRoomRealtimeGateway
// pair (see beforeEach below) — total isolation, no globalThis, no shared
// registry between tests (unlike the old rooms.server.ts module singleton).
function createHarness() {
	const rooms = new InMemoryRoomRepository();
	const realtime = new InMemoryRoomRealtimeGateway(rooms);
	return {
		rooms,
		realtime,
		createRoom: (name: string) => new CreateRoomUseCase(rooms).execute(name),
		joinRoom: (code: string, name: string, participantId?: string) =>
			new JoinRoomUseCase(rooms, realtime).execute(code, name, participantId),
		startRound: (code: string, participantId: string, question: string) =>
			new StartRoundUseCase(rooms, realtime).execute(
				code,
				participantId,
				question,
			),
		castVote: (
			code: string,
			participantId: string,
			roundId: string,
			card: CardValue,
		) =>
			new CastVoteUseCase(rooms, realtime).execute(
				code,
				participantId,
				roundId,
				card,
			),
		reveal: (code: string, participantId: string) =>
			new RevealUseCase(rooms, realtime).execute(code, participantId),
		closeResult: (code: string, participantId: string) =>
			new CloseResultUseCase(rooms, realtime).execute(code, participantId),
		leaveRoom: (code: string, participantId: string) =>
			new LeaveRoomUseCase(rooms, realtime).execute(code, participantId),
		kickParticipant: (code: string, participantId: string, targetId: string) =>
			new KickParticipantUseCase(rooms, realtime).execute(
				code,
				participantId,
				targetId,
			),
		closeRoom: (code: string, participantId: string) =>
			new CloseRoomUseCase(rooms, realtime).execute(code, participantId),
		subscribe: (code: string, participantId: string, send: Send) =>
			realtime.subscribe(code, participantId, send),
		getRoom: (code: string) => rooms.findByCode(code),
		toSnapshotForCode: (code: string, viewerId: string) =>
			new GetRoomSnapshotUseCase(rooms, realtime).execute(code, viewerId),
	};
}

let harness: ReturnType<typeof createHarness>;

beforeEach(() => {
	harness = createHarness();
});

function mustOk<T>(result: { ok: boolean; data?: T; error?: unknown }): T {
	if (!result.ok) {
		throw new Error(`expected ok result, got error: ${String(result.error)}`);
	}
	// biome-ignore lint/style/noNonNullAssertion: narrowed by the throw above
	return result.data!;
}

function createTestRoom(masterName = "Master") {
	const created = mustOk(harness.createRoom(masterName));
	return { code: created.snapshot.code, masterId: created.participantId };
}

describe("computeResults / roundUpToFibonacci", () => {
	it("rounds a mean up to the nearest Fibonacci value", () => {
		expect(roundUpToFibonacci(4)).toBe(5);
		expect(roundUpToFibonacci(5)).toBe(5);
		expect(roundUpToFibonacci(0)).toBe(0);
		expect(roundUpToFibonacci(-3)).toBe(0);
		expect(roundUpToFibonacci(1000)).toBe(89);
	});

	it("returns null/empty for no votes", () => {
		expect(computeResults([])).toEqual({
			average: null,
			blocked: false,
			voteCount: 0,
		});
	});

	it("blocks (no average) when any vote is a discussion card", () => {
		expect(computeResults([1, 2, "?"])).toEqual({
			average: null,
			blocked: true,
			voteCount: 3,
		});
		expect(computeResults(["☕"])).toMatchObject({ blocked: true });
	});

	it("averages numeric votes and rounds up", () => {
		expect(computeResults([1, 2, 3])).toEqual({
			average: 2, // mean is 2, and 2 is itself a Fibonacci value
			blocked: false,
			voteCount: 3,
		});
		expect(computeResults([2, 3, 5])).toEqual({
			average: 5, // mean 3.33 rounds up to the next Fibonacci value
			blocked: false,
			voteCount: 3,
		});
	});
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

describe("JoinRoomUseCase", () => {
	it("fails for a room that doesn't exist", () => {
		expect(harness.joinRoom("ZZZZZZ", "Fede")).toEqual({
			ok: false,
			error: "ROOM_NOT_FOUND",
		});
	});

	it("rejects an invalid name", () => {
		const { code } = createTestRoom();
		expect(harness.joinRoom(code, "")).toEqual({
			ok: false,
			error: "INVALID_NAME",
		});
	});

	it("rejects a name already taken in the room, case-insensitively", () => {
		const { code } = createTestRoom("Ana");
		expect(harness.joinRoom(code, "ana")).toEqual({
			ok: false,
			error: "NAME_TAKEN",
		});
	});

	it("adds a new participant, not master", () => {
		const { code, masterId } = createTestRoom();
		const { participantId, snapshot } = mustOk(harness.joinRoom(code, "Fede"));
		expect(participantId).not.toBe(masterId);
		const fede = snapshot.participants.find((p) => p.id === participantId);
		expect(fede).toMatchObject({ name: "Fede", isMaster: false });
	});

	it("is idempotent for a returning participant (same id, updates name)", () => {
		const { code } = createTestRoom();
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

describe("StartRoundUseCase", () => {
	it("fails for a room that doesn't exist", () => {
		expect(harness.startRound("ZZZZZZ", "x", "q")).toEqual({
			ok: false,
			error: "ROOM_NOT_FOUND",
		});
	});

	it("requires the master", () => {
		const { code } = createTestRoom();
		const { participantId } = mustOk(harness.joinRoom(code, "Fede"));
		expect(
			harness.startRound(code, participantId, "¿Cuánto esfuerzo?"),
		).toEqual({
			ok: false,
			error: "NOT_MASTER",
		});
	});

	it("rejects an invalid question", () => {
		const { code, masterId } = createTestRoom();
		expect(harness.startRound(code, masterId, "")).toEqual({
			ok: false,
			error: "INVALID_QUESTION",
		});
	});

	it("sets question, status voting, a fresh roundId, and clears votes", () => {
		const { code, masterId } = createTestRoom();
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

describe("CastVoteUseCase", () => {
	it("fails for a room that doesn't exist", () => {
		expect(harness.castVote("ZZZZZZ", "x", "round", 5)).toEqual({
			ok: false,
			error: "ROOM_NOT_FOUND",
		});
	});

	it("rejects a vote for a stale/non-live round", () => {
		const { code, masterId } = createTestRoom();
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
		const { code, masterId } = createTestRoom();
		const started = mustOk(harness.startRound(code, masterId, "q"));
		expect(
			harness.castVote(code, masterId, started.roundId, 4 as never),
		).toEqual({
			ok: false,
			error: "INVALID_VOTE",
		});
	});

	it("records the vote and marks hasVoted for that participant only", () => {
		const { code, masterId } = createTestRoom();
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
		const { code, masterId } = createTestRoom();
		const { participantId: fedeId } = mustOk(harness.joinRoom(code, "Fede"));
		const started = mustOk(harness.startRound(code, masterId, "q"));

		mustOk(harness.castVote(code, masterId, started.roundId, 5));
		expect(harness.getRoom(code)?.status).toBe("voting");
		const after = mustOk(harness.castVote(code, fedeId, started.roundId, 8));
		expect(after.status).toBe("revealed");
	});
});

describe("RevealUseCase", () => {
	it("requires the master", () => {
		const { code } = createTestRoom();
		const { participantId } = mustOk(harness.joinRoom(code, "Fede"));
		expect(harness.reveal(code, participantId)).toEqual({
			ok: false,
			error: "NOT_MASTER",
		});
	});

	it("is an idempotent no-op outside voting", () => {
		const { code, masterId } = createTestRoom();
		const before = mustOk(harness.reveal(code, masterId)); // called while still "waiting"
		expect(before.status).toBe("waiting");
	});

	it("moves voting -> revealed", () => {
		const { code, masterId } = createTestRoom();
		mustOk(harness.startRound(code, masterId, "q"));
		const after = mustOk(harness.reveal(code, masterId));
		expect(after.status).toBe("revealed");
	});
});

describe("CloseResultUseCase", () => {
	it("requires the master", () => {
		const { code } = createTestRoom();
		const { participantId } = mustOk(harness.joinRoom(code, "Fede"));
		expect(harness.closeResult(code, participantId)).toEqual({
			ok: false,
			error: "NOT_MASTER",
		});
	});

	it("is an idempotent no-op outside revealed", () => {
		const { code, masterId } = createTestRoom();
		const before = mustOk(harness.closeResult(code, masterId)); // still "waiting"
		expect(before.status).toBe("waiting");
	});

	it("moves revealed -> waiting and keeps the question", () => {
		const { code, masterId } = createTestRoom();
		mustOk(harness.startRound(code, masterId, "¿Cuánto esfuerzo?"));
		mustOk(harness.reveal(code, masterId));
		const after = mustOk(harness.closeResult(code, masterId));
		expect(after.status).toBe("waiting");
		expect(after.question).toBe("¿Cuánto esfuerzo?");
	});
});

describe("LeaveRoomUseCase", () => {
	it("fails for a room that doesn't exist", () => {
		expect(harness.leaveRoom("ZZZZZZ", "x")).toEqual({
			ok: false,
			error: "ROOM_NOT_FOUND",
		});
	});

	it("the master cannot leave", () => {
		const { code, masterId } = createTestRoom();
		expect(harness.leaveRoom(code, masterId)).toEqual({
			ok: false,
			error: "MASTER_CANNOT_LEAVE",
		});
	});

	it("removes the participant and is idempotent on a second call", () => {
		const { code } = createTestRoom();
		const { participantId } = mustOk(harness.joinRoom(code, "Fede"));
		const after = mustOk(harness.leaveRoom(code, participantId));
		expect(after.participants.some((p) => p.id === participantId)).toBe(false);
		// Already gone — still succeeds, no-op.
		expect(harness.leaveRoom(code, participantId).ok).toBe(true);
	});
});

describe("KickParticipantUseCase", () => {
	it("requires the master", () => {
		const { code } = createTestRoom();
		const { participantId: fedeId } = mustOk(harness.joinRoom(code, "Fede"));
		const { participantId: anaId } = mustOk(harness.joinRoom(code, "Ana"));
		expect(harness.kickParticipant(code, fedeId, anaId)).toEqual({
			ok: false,
			error: "NOT_MASTER",
		});
	});

	it("the master cannot kick themselves", () => {
		const { code, masterId } = createTestRoom();
		expect(harness.kickParticipant(code, masterId, masterId)).toEqual({
			ok: false,
			error: "CANNOT_KICK_SELF",
		});
	});

	it("removes the target participant", () => {
		const { code, masterId } = createTestRoom();
		const { participantId: fedeId } = mustOk(harness.joinRoom(code, "Fede"));
		const after = mustOk(harness.kickParticipant(code, masterId, fedeId));
		expect(after.participants.some((p) => p.id === fedeId)).toBe(false);
	});

	// This is the ordering guarantee the client's own-seat-missing rejoin
	// effect depends on: the kicked participant must receive "kicked" and
	// never another "snapshot" without themselves in it, or their own tab
	// would silently rejoin and undo the kick.
	it("notifies the kicked participant directly and never sends them another snapshot", () => {
		const { code, masterId } = createTestRoom();
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

describe("CloseRoomUseCase", () => {
	it("requires the master", () => {
		const { code } = createTestRoom();
		const { participantId } = mustOk(harness.joinRoom(code, "Fede"));
		expect(harness.closeRoom(code, participantId)).toEqual({
			ok: false,
			error: "NOT_MASTER",
		});
	});

	it("notifies every subscriber and removes the room", () => {
		const { code, masterId } = createTestRoom();
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

describe("subscribe / connection tracking", () => {
	it("marks a participant disconnected immediately, then prunes them after the grace period unless they reconnect", () => {
		vi.useFakeTimers();
		try {
			const { code, masterId } = createTestRoom();
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
			const { code, masterId } = createTestRoom();
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

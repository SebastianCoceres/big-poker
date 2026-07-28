import type { Send } from "../application/ports";
import { CastVoteUseCase } from "../application/use-cases/cast-vote";
import { CloseResultUseCase } from "../application/use-cases/close-result";
import { CloseRoomUseCase } from "../application/use-cases/close-room";
import { CreateRoomUseCase } from "../application/use-cases/create-room";
import { GetRoomSnapshotUseCase } from "../application/use-cases/get-room-snapshot";
import { JoinRoomUseCase } from "../application/use-cases/join-room";
import { KickParticipantUseCase } from "../application/use-cases/kick-participant";
import { LeaveRoomUseCase } from "../application/use-cases/leave-room";
import { RevealUseCase } from "../application/use-cases/reveal";
import { StartRoundUseCase } from "../application/use-cases/start-round";
import type { CardValue } from "../domain/voting";
import { InMemoryRoomRealtimeGateway } from "../infrastructure/in-memory-room-realtime-gateway";
import { InMemoryRoomRepository } from "../infrastructure/in-memory-room-repository";

/**
 * Shared test scaffolding for use-case specs — NOT a test file itself (no
 * `.test.` in its name, Vitest won't try to run it). Every use-case test
 * file gets its own fresh harness via `createHarness()` in its own
 * `beforeEach`, so tests stay isolated from each other without touching
 * globalThis — unlike the old rooms.server.ts module singleton.
 */
export function createHarness() {
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

export type RoomHarness = ReturnType<typeof createHarness>;

export function mustOk<T>(result: {
	ok: boolean;
	data?: T;
	error?: unknown;
}): T {
	if (!result.ok) {
		throw new Error(`expected ok result, got error: ${String(result.error)}`);
	}
	// biome-ignore lint/style/noNonNullAssertion: narrowed by the throw above
	return result.data!;
}

export function createTestRoom(harness: RoomHarness, masterName = "Master") {
	const created = mustOk(harness.createRoom(masterName));
	return { code: created.snapshot.code, masterId: created.participantId };
}

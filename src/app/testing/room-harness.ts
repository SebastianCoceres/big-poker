import { JoinRoomUseCase } from "#/features/participants/application/use-cases/join-room";
import { KickParticipantUseCase } from "#/features/participants/application/use-cases/kick-participant";
import { LeaveRoomUseCase } from "#/features/participants/application/use-cases/leave-room";
import type { Send } from "#/features/room/application/ports";
import { CloseRoomUseCase } from "#/features/room/application/use-cases/close-room";
import { CreateRoomUseCase } from "#/features/room/application/use-cases/create-room";
import { GetRoomSnapshotUseCase } from "#/features/room/application/use-cases/get-room-snapshot";
import { InMemoryRoomRealtimeGateway } from "#/features/room/infrastructure/in-memory-room-realtime-gateway";
import { InMemoryRoomRepository } from "#/features/room/infrastructure/in-memory-room-repository";
import { CastVoteUseCase } from "#/features/voting/application/use-cases/cast-vote";
import { CloseResultUseCase } from "#/features/voting/application/use-cases/close-result";
import { RevealUseCase } from "#/features/voting/application/use-cases/reveal";
import { StartRoundUseCase } from "#/features/voting/application/use-cases/start-round";
import type { CardValue } from "#/features/voting/domain/entities";
import { FibonacciVoteScorer } from "#/features/voting/infrastructure/fibonacci-vote-scorer";

/**
 * Shared test scaffolding for use-case specs — NOT a test file itself (no
 * `.test.` in its name, Vitest won't try to run it). Lives outside every
 * feature for the same reason the composition root does: it builds use-cases
 * from `room`, `participants`, and `voting` sharing one repository/gateway
 * pair. Every use-case test file gets its own fresh harness via
 * `createHarness()` in its own `beforeEach`, so tests stay isolated from each
 * other without touching globalThis — unlike the old rooms.server.ts module
 * singleton.
 */
export function createHarness() {
	const rooms = new InMemoryRoomRepository();
	const voteScorer = new FibonacciVoteScorer();
	const realtime = new InMemoryRoomRealtimeGateway(rooms, voteScorer);
	return {
		rooms,
		realtime,
		createRoom: (name: string) => new CreateRoomUseCase(rooms).execute(name),
		joinRoom: (code: string, name: string, participantId?: string) =>
			new JoinRoomUseCase(rooms, realtime, voteScorer).execute(
				code,
				name,
				participantId,
			),
		startRound: (code: string, participantId: string, question: string) =>
			new StartRoundUseCase(rooms, realtime, voteScorer).execute(
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
			new CastVoteUseCase(rooms, realtime, voteScorer).execute(
				code,
				participantId,
				roundId,
				card,
			),
		reveal: (code: string, participantId: string) =>
			new RevealUseCase(rooms, realtime, voteScorer).execute(
				code,
				participantId,
			),
		closeResult: (code: string, participantId: string) =>
			new CloseResultUseCase(rooms, realtime, voteScorer).execute(
				code,
				participantId,
			),
		leaveRoom: (code: string, participantId: string) =>
			new LeaveRoomUseCase(rooms, realtime, voteScorer).execute(
				code,
				participantId,
			),
		kickParticipant: (code: string, participantId: string, targetId: string) =>
			new KickParticipantUseCase(rooms, realtime, voteScorer).execute(
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
			new GetRoomSnapshotUseCase(rooms, realtime, voteScorer).execute(
				code,
				viewerId,
			),
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

import { JoinRoomUseCase } from "#/features/participants/application/use-cases/join-room";
import { KickParticipantUseCase } from "#/features/participants/application/use-cases/kick-participant";
import { LeaveRoomUseCase } from "#/features/participants/application/use-cases/leave-room";
import { CloseRoomUseCase } from "#/features/room/application/use-cases/close-room";
import { CreateRoomUseCase } from "#/features/room/application/use-cases/create-room";
import { GetRoomSnapshotUseCase } from "#/features/room/application/use-cases/get-room-snapshot";
import { InMemoryRoomRealtimeGateway } from "#/features/room/infrastructure/in-memory-room-realtime-gateway";
import { InMemoryRoomRepository } from "#/features/room/infrastructure/in-memory-room-repository";
import { CastVoteUseCase } from "#/features/voting/application/use-cases/cast-vote";
import { CloseResultUseCase } from "#/features/voting/application/use-cases/close-result";
import { RevealUseCase } from "#/features/voting/application/use-cases/reveal";
import { StartRoundUseCase } from "#/features/voting/application/use-cases/start-round";
import { FibonacciVoteScorer } from "#/features/voting/infrastructure/fibonacci-vote-scorer";

/**
 * Composition root — lives outside every feature on purpose. It needs to
 * instantiate use-cases from `room`, `participants`, and `voting`, all
 * sharing the same `RoomRepository`/`RoomRealtimeGateway` instances; living
 * inside any one of those features would force that feature to import from
 * the others, violating ownership.
 */
function buildContainer() {
	const roomRepository = new InMemoryRoomRepository();
	// The only place `room` (via its `VoteScorer` port) and `voting` (this
	// concrete implementation) meet — `app/` is the one layer allowed to know
	// every feature.
	const voteScorer = new FibonacciVoteScorer();
	const roomRealtimeGateway = new InMemoryRoomRealtimeGateway(
		roomRepository,
		voteScorer,
	);

	return {
		roomRepository,
		roomRealtimeGateway,
		createRoomUseCase: new CreateRoomUseCase(roomRepository),
		joinRoomUseCase: new JoinRoomUseCase(
			roomRepository,
			roomRealtimeGateway,
			voteScorer,
		),
		startRoundUseCase: new StartRoundUseCase(
			roomRepository,
			roomRealtimeGateway,
			voteScorer,
		),
		castVoteUseCase: new CastVoteUseCase(
			roomRepository,
			roomRealtimeGateway,
			voteScorer,
		),
		revealUseCase: new RevealUseCase(
			roomRepository,
			roomRealtimeGateway,
			voteScorer,
		),
		closeResultUseCase: new CloseResultUseCase(
			roomRepository,
			roomRealtimeGateway,
			voteScorer,
		),
		leaveRoomUseCase: new LeaveRoomUseCase(
			roomRepository,
			roomRealtimeGateway,
			voteScorer,
		),
		kickParticipantUseCase: new KickParticipantUseCase(
			roomRepository,
			roomRealtimeGateway,
			voteScorer,
		),
		closeRoomUseCase: new CloseRoomUseCase(roomRepository, roomRealtimeGateway),
		getRoomSnapshotUseCase: new GetRoomSnapshotUseCase(
			roomRepository,
			roomRealtimeGateway,
			voteScorer,
		),
	};
}

type Container = ReturnType<typeof buildContainer>;

// Guarded on globalThis so Vite's SSR module re-execution on file edits (dev
// HMR) doesn't reset an in-flight Map of live rooms — same pattern the old
// rooms.server.ts registry used.
const g = globalThis as unknown as { __bigPokerContainer?: Container };
export const container: Container = g.__bigPokerContainer ?? buildContainer();
if (import.meta.env.DEV) g.__bigPokerContainer = container;

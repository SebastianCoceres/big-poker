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
import { InMemoryRoomRealtimeGateway } from "./in-memory-room-realtime-gateway";
import { InMemoryRoomRepository } from "./in-memory-room-repository";

function buildContainer() {
	const roomRepository = new InMemoryRoomRepository();
	const roomRealtimeGateway = new InMemoryRoomRealtimeGateway(roomRepository);

	return {
		roomRepository,
		roomRealtimeGateway,
		createRoomUseCase: new CreateRoomUseCase(roomRepository),
		joinRoomUseCase: new JoinRoomUseCase(roomRepository, roomRealtimeGateway),
		startRoundUseCase: new StartRoundUseCase(
			roomRepository,
			roomRealtimeGateway,
		),
		castVoteUseCase: new CastVoteUseCase(roomRepository, roomRealtimeGateway),
		revealUseCase: new RevealUseCase(roomRepository, roomRealtimeGateway),
		closeResultUseCase: new CloseResultUseCase(
			roomRepository,
			roomRealtimeGateway,
		),
		leaveRoomUseCase: new LeaveRoomUseCase(roomRepository, roomRealtimeGateway),
		kickParticipantUseCase: new KickParticipantUseCase(
			roomRepository,
			roomRealtimeGateway,
		),
		closeRoomUseCase: new CloseRoomUseCase(roomRepository, roomRealtimeGateway),
		getRoomSnapshotUseCase: new GetRoomSnapshotUseCase(
			roomRepository,
			roomRealtimeGateway,
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

import type {
	RoomRealtimeGateway,
	RoomRepository,
	VoteScorer,
} from "#/features/room/application/ports";
import {
	broadcastRoomSnapshot,
	snapshotWithConnections,
} from "#/features/room/application/snapshot-broadcast";
import type { Result, RoomSnapshot } from "#/features/room/domain/entities";

export class RevealUseCase {
	constructor(
		private readonly rooms: RoomRepository,
		private readonly realtime: RoomRealtimeGateway,
		private readonly voteScorer: VoteScorer,
	) {}

	execute(code: string, participantId: string): Result<RoomSnapshot> {
		const room = this.rooms.findByCode(code);
		if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };
		if (room.masterId !== participantId) {
			return { ok: false, error: "NOT_MASTER" };
		}

		// Idempotent no-op outside "voting" (e.g. double-click, or clicked before
		// any round started) rather than a hard error — the UI only shows the
		// reveal control during voting anyway.
		if (room.status === "voting") {
			room.status = "revealed";
			room.lastActivityAt = Date.now();
			this.rooms.save(room);
			broadcastRoomSnapshot(this.realtime, room, this.voteScorer);
		}
		return {
			ok: true,
			data: snapshotWithConnections(this.realtime, room, this.voteScorer),
		};
	}
}

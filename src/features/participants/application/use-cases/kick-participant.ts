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

export class KickParticipantUseCase {
	constructor(
		private readonly rooms: RoomRepository,
		private readonly realtime: RoomRealtimeGateway,
		private readonly voteScorer: VoteScorer,
	) {}

	execute(
		code: string,
		participantId: string,
		targetId: string,
	): Result<RoomSnapshot> {
		const room = this.rooms.findByCode(code);
		if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };
		if (room.masterId !== participantId) {
			return { ok: false, error: "NOT_MASTER" };
		}
		if (targetId === participantId) {
			return { ok: false, error: "CANNOT_KICK_SELF" };
		}

		if (room.participants.delete(targetId)) {
			room.lastActivityAt = Date.now();
			this.rooms.save(room);

			// Tell the kicked participant directly BEFORE the general broadcast
			// below. broadcastRoomSnapshot() only iterates room.participants —
			// targetId was just removed from it above, so they structurally
			// cannot receive one more "snapshot" without themselves in it (which
			// would otherwise trigger the client's own "rejoin if my seat is
			// missing" effect and silently undo the kick). See the comment on
			// broadcastRoomSnapshot for details.
			this.realtime.publishTo(code, targetId, "kicked", {});
			broadcastRoomSnapshot(this.realtime, room, this.voteScorer);
		}
		return {
			ok: true,
			data: snapshotWithConnections(
				this.realtime,
				room,
				this.voteScorer,
				participantId,
			),
		};
	}
}

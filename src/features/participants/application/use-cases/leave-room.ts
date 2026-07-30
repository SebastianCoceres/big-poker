import type {
	RoomRealtimeGateway,
	RoomRepository,
	VoteScorer,
} from "#/features/room/application/ports";
import {
	broadcastRoomSnapshot,
	snapshotWithConnections,
} from "#/features/room/application/snapshot-broadcast";
import type { RoomSnapshot } from "#/features/room/domain/entities";
import { leaveRoom } from "#/features/room/domain/room-operations";
import type { Result } from "#/features/room/domain/result";

export class LeaveRoomUseCase {
	constructor(
		private readonly rooms: RoomRepository,
		private readonly realtime: RoomRealtimeGateway,
		private readonly voteScorer: VoteScorer,
	) {}

	execute(code: string, participantId: string): Result<RoomSnapshot> {
		const room = this.rooms.findByCode(code);
		if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };

		const result = leaveRoom(room, participantId);
		if (!result.ok) return result;

		if (result.data) {
			this.rooms.save(room);

			// broadcastRoomSnapshot() below only iterates room.participants — the
			// leaving participant was just removed from it above, so they
			// structurally cannot receive one more personalized "snapshot"
			// missing themselves (which would otherwise trigger the client's own
			// "rejoin if my seat is missing" effect and silently undo the leave).
			// See the comment on broadcastRoomSnapshot for why this replaces the
			// original code's explicit "drop the subscriber entry first" step.
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

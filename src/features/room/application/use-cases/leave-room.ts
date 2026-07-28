import type { Result, RoomSnapshot } from "../../domain/entities";
import type { RoomRealtimeGateway, RoomRepository } from "../ports";
import {
	broadcastRoomSnapshot,
	snapshotWithConnections,
} from "../snapshot-broadcast";

export class LeaveRoomUseCase {
	constructor(
		private readonly rooms: RoomRepository,
		private readonly realtime: RoomRealtimeGateway,
	) {}

	execute(code: string, participantId: string): Result<RoomSnapshot> {
		const room = this.rooms.findByCode(code);
		if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };
		// The master has no seat to hand off to — closing the room is the only
		// way out for them, mirrors reveal()/closeResult() requiring a role.
		if (room.masterId === participantId) {
			return { ok: false, error: "MASTER_CANNOT_LEAVE" };
		}

		// Idempotent no-op if already gone (double-click), mirrors
		// reveal/closeResult.
		if (room.participants.delete(participantId)) {
			room.lastActivityAt = Date.now();
			this.rooms.save(room);

			// broadcastRoomSnapshot() below only iterates room.participants — the
			// leaving participant was just removed from it above, so they
			// structurally cannot receive one more personalized "snapshot"
			// missing themselves (which would otherwise trigger the client's own
			// "rejoin if my seat is missing" effect and silently undo the leave).
			// See the comment on broadcastRoomSnapshot for why this replaces the
			// original code's explicit "drop the subscriber entry first" step.
			broadcastRoomSnapshot(this.realtime, room);
		}
		return {
			ok: true,
			data: snapshotWithConnections(this.realtime, room, participantId),
		};
	}
}

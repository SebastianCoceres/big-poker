import type { Result, RoomSnapshot } from "../../domain/entities";
import type { RoomRealtimeGateway, RoomRepository } from "../ports";
import {
	broadcastRoomSnapshot,
	snapshotWithConnections,
} from "../snapshot-broadcast";

export class CloseResultUseCase {
	constructor(
		private readonly rooms: RoomRepository,
		private readonly realtime: RoomRealtimeGateway,
	) {}

	execute(code: string, participantId: string): Result<RoomSnapshot> {
		const room = this.rooms.findByCode(code);
		if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };
		if (room.masterId !== participantId) {
			return { ok: false, error: "NOT_MASTER" };
		}

		// Idempotent no-op outside "revealed" (double-click), mirrors reveal().
		// Deliberately does NOT clear room.question — QuestionPanel uses its
		// presence to say "Nueva pregunta" vs "Primera pregunta" on the next
		// round's form, and clearing it here would wrongly reset that label.
		if (room.status === "revealed") {
			room.status = "waiting";
			room.lastActivityAt = Date.now();
			this.rooms.save(room);
			broadcastRoomSnapshot(this.realtime, room);
		}
		return { ok: true, data: snapshotWithConnections(this.realtime, room) };
	}
}

import type { Result } from "../../domain/result";
import type { RoomRealtimeGateway, RoomRepository } from "../ports";

export class CloseRoomUseCase {
	constructor(
		private readonly rooms: RoomRepository,
		private readonly realtime: RoomRealtimeGateway,
	) {}

	execute(code: string, participantId: string): Result<true> {
		const room = this.rooms.findByCode(code);
		if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };
		if (room.masterId !== participantId) {
			return { ok: false, error: "NOT_MASTER" };
		}

		this.realtime.publishToAll(room.code, "closed", {});
		this.realtime.releaseRoom(room.code);
		this.rooms.delete(room.code);
		return { ok: true, data: true };
	}
}

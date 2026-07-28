import type { RoomSnapshot } from "../../domain/entities";
import type { RoomRealtimeGateway, RoomRepository } from "../ports";
import { snapshotWithConnections } from "../snapshot-broadcast";

/** Used by the SSE handler to build the initial snapshot on connect. */
export class GetRoomSnapshotUseCase {
	constructor(
		private readonly rooms: RoomRepository,
		private readonly realtime: RoomRealtimeGateway,
	) {}

	execute(code: string, viewerId: string): RoomSnapshot | undefined {
		const room = this.rooms.findByCode(code);
		if (!room) return undefined;
		return snapshotWithConnections(this.realtime, room, viewerId);
	}
}

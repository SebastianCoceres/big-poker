import type { RoomSnapshot } from "../../domain/entities";
import type { RoomRealtimeGateway, RoomRepository, VoteScorer } from "../ports";
import { snapshotWithConnections } from "../snapshot-broadcast";

/** Used by the SSE handler to build the initial snapshot on connect. */
export class GetRoomSnapshotUseCase {
	constructor(
		private readonly rooms: RoomRepository,
		private readonly realtime: RoomRealtimeGateway,
		private readonly voteScorer: VoteScorer,
	) {}

	execute(code: string, viewerId: string): RoomSnapshot | undefined {
		const room = this.rooms.findByCode(code);
		if (!room) return undefined;
		return snapshotWithConnections(
			this.realtime,
			room,
			this.voteScorer,
			viewerId,
		);
	}
}

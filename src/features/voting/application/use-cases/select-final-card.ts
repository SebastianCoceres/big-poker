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
import type { Result } from "#/features/room/domain/result";
import { selectFinalCard } from "#/features/room/domain/room-operations";

export class SelectFinalCardUseCase {
	constructor(
		private readonly rooms: RoomRepository,
		private readonly realtime: RoomRealtimeGateway,
		private readonly voteScorer: VoteScorer,
	) {}

	execute(
		code: string,
		participantId: string,
		roundId: string,
		card: number,
	): Result<RoomSnapshot> {
		const room = this.rooms.findByCode(code);
		if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };

		// Picking a final card only makes sense once the round is revealed and
		// only for the round the caller actually saw — same staleness guard as
		// cast-vote.ts, mirrored to the "revealed" phase instead of "voting".
		if (room.status !== "revealed" || room.roundId !== roundId) {
			return { ok: false, error: "STALE_ROUND" };
		}

		const result = selectFinalCard(room, participantId, card);
		if (!result.ok) return result;

		this.rooms.save(room);
		broadcastRoomSnapshot(this.realtime, room, this.voteScorer);
		return {
			ok: true,
			data: snapshotWithConnections(this.realtime, room, this.voteScorer),
		};
	}
}

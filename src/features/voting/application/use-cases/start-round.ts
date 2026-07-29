import type {
	RoomRealtimeGateway,
	RoomRepository,
	VoteScorer,
} from "#/features/room/application/ports";
import {
	broadcastRoomSnapshot,
	snapshotWithConnections,
} from "#/features/room/application/snapshot-broadcast";
import { cleanText } from "#/features/room/application/text";
import type { Result, RoomSnapshot } from "#/features/room/domain/entities";

export class StartRoundUseCase {
	constructor(
		private readonly rooms: RoomRepository,
		private readonly realtime: RoomRealtimeGateway,
		private readonly voteScorer: VoteScorer,
	) {}

	execute(
		code: string,
		participantId: string,
		question: string,
	): Result<RoomSnapshot> {
		const room = this.rooms.findByCode(code);
		if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };
		if (room.masterId !== participantId) {
			return { ok: false, error: "NOT_MASTER" };
		}

		const cleanQuestion = cleanText(question, 300);
		if (!cleanQuestion) return { ok: false, error: "INVALID_QUESTION" };

		room.question = cleanQuestion;
		room.status = "voting";
		room.roundId = crypto.randomUUID();
		for (const p of room.participants.values()) p.vote = null;
		room.lastActivityAt = Date.now();
		this.rooms.save(room);
		broadcastRoomSnapshot(this.realtime, room, this.voteScorer);
		return {
			ok: true,
			data: snapshotWithConnections(this.realtime, room, this.voteScorer),
		};
	}
}

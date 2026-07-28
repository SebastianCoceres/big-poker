import type { Result, RoomSnapshot } from "../../domain/entities";
import { type CardValue, isCardValue } from "../../domain/voting";
import type { RoomRealtimeGateway, RoomRepository } from "../ports";
import {
	broadcastRoomSnapshot,
	snapshotWithConnections,
} from "../snapshot-broadcast";

export class CastVoteUseCase {
	constructor(
		private readonly rooms: RoomRepository,
		private readonly realtime: RoomRealtimeGateway,
	) {}

	execute(
		code: string,
		participantId: string,
		roundId: string,
		card: CardValue,
	): Result<RoomSnapshot> {
		const room = this.rooms.findByCode(code);
		if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };

		// A vote for a round that's no longer the live one (slow network, or the
		// master already moved on) is discarded rather than applied — this also
		// covers "not currently voting" (waiting/revealed) since roundId can only
		// match while status === "voting".
		if (room.status !== "voting" || room.roundId !== roundId) {
			return { ok: false, error: "STALE_ROUND" };
		}
		if (!isCardValue(card)) return { ok: false, error: "INVALID_VOTE" };

		const participant = room.participants.get(participantId);
		// No seat in this room for this identity (should not happen in the
		// normal flow, since the client always joins before it can see the card
		// board).
		if (!participant) return { ok: false, error: "ROOM_NOT_FOUND" };

		participant.vote = card;
		room.lastActivityAt = Date.now();

		// Auto-reveal once every seat has a vote — same total the UI already
		// shows as "X de Y ya votaron" (QuestionPanel.tsx). Includes
		// disconnected participants on purpose: if one of them never votes, this
		// never fires and the master's manual "Revelar votos" stays the
		// fallback.
		const allVoted = [...room.participants.values()].every(
			(p) => p.vote !== null,
		);
		if (allVoted) room.status = "revealed";

		this.rooms.save(room);
		broadcastRoomSnapshot(this.realtime, room);
		return { ok: true, data: snapshotWithConnections(this.realtime, room) };
	}
}

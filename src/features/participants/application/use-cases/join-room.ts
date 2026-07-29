import { isNameTaken } from "#/features/participants/domain/participant-name";
import type { JoinedRoom } from "#/features/room/application/dtos";
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
import type { Result } from "#/features/room/domain/result";

export class JoinRoomUseCase {
	constructor(
		private readonly rooms: RoomRepository,
		private readonly realtime: RoomRealtimeGateway,
		private readonly voteScorer: VoteScorer,
	) {}

	// `participantId` is only passed by a returning participant (reconnect/page
	// refresh) reclaiming their existing seat — see the rejoin effect in
	// room/$roomCode.tsx. A first-time join omits it and gets a freshly minted
	// one back in the result, for the same secure-context reason as
	// CreateRoomUseCase.
	execute(
		code: string,
		name: string,
		participantId?: string,
	): Result<JoinedRoom> {
		const room = this.rooms.findByCode(code);
		if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };

		const cleanName = cleanText(name, 30);
		if (!cleanName) return { ok: false, error: "INVALID_NAME" };

		const resolvedId = participantId ?? crypto.randomUUID();
		if (isNameTaken(room, cleanName, resolvedId)) {
			return { ok: false, error: "NAME_TAKEN" };
		}

		const existing = room.participants.get(resolvedId);
		if (existing) {
			// Idempotent: reconnecting/refreshing re-sends join with the same id.
			existing.name = cleanName;
		} else {
			room.participants.set(resolvedId, {
				id: resolvedId,
				name: cleanName,
				isMaster: resolvedId === room.masterId,
				vote: null,
				joinedAt: Date.now(),
			});
		}
		room.lastActivityAt = Date.now();
		this.rooms.save(room);
		broadcastRoomSnapshot(this.realtime, room, this.voteScorer);
		return {
			ok: true,
			data: {
				participantId: resolvedId,
				snapshot: snapshotWithConnections(this.realtime, room, this.voteScorer),
			},
		};
	}
}

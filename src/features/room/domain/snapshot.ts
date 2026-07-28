import type { Room, RoomSnapshot } from "./entities";
import { type CardValue, computeResults } from "./voting";

// `viewerId` lets each participant always see their OWN vote before reveal
// (they already know what card they picked — hiding it from themselves only
// breaks reconnection/refresh, it doesn't add any privacy), while everyone
// else's vote stays hidden until the room is revealed.
//
// `connectedIds` is passed in rather than looked up here — this function is a
// pure projection of (Room, connection state) -> RoomSnapshot with no I/O of
// its own; the caller (a use case, backed by the RoomRealtimeGateway port) is
// responsible for resolving which participants are currently connected.
export function buildSnapshot(
	room: Room,
	connectedIds: Set<string>,
	viewerId?: string,
): RoomSnapshot {
	const participants = [...room.participants.values()].map((p) => ({
		id: p.id,
		name: p.name,
		isMaster: p.isMaster,
		hasVoted: p.vote !== null,
		vote: room.status === "revealed" || p.id === viewerId ? p.vote : null,
		connected: connectedIds.has(p.id),
	}));

	const results =
		room.status === "revealed"
			? computeResults(
					[...room.participants.values()]
						.map((p) => p.vote)
						.filter((v): v is CardValue => v !== null),
				)
			: null;

	return {
		code: room.code,
		status: room.status,
		question: room.question,
		roundId: room.roundId,
		masterId: room.masterId,
		participants,
		results,
	};
}

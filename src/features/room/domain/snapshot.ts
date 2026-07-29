import type { Room, RoomSnapshot } from "./entities";

// `viewerId` lets each participant always see their OWN vote before reveal
// (they already know what card they picked — hiding it from themselves only
// breaks reconnection/refresh, it doesn't add any privacy), while everyone
// else's vote stays hidden until the room is revealed.
//
// `connectedIds` is passed in rather than looked up here — this function is a
// pure projection of (Room, connection state) -> RoomSnapshot with no I/O of
// its own; the caller (a use case, backed by the RoomRealtimeGateway port) is
// responsible for resolving which participants are currently connected.
//
// `results` is likewise passed in already computed rather than derived here —
// scoring votes is `voting`'s domain (see the `VoteScorer` port), this
// function only knows how to assemble a snapshot from whatever result it's
// given.
export function buildSnapshot(
	room: Room,
	connectedIds: Set<string>,
	results: {
		average: number | null;
		blocked: boolean;
		voteCount: number;
	} | null,
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

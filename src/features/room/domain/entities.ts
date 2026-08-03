export type RoundStatus = "waiting" | "voting" | "revealed";

// `room`'s own view of a seat in its roster. Conceptually, a RoomMember IS
// a Participant (features/participants/domain/entities.ts) — Participant is
// the real entity, basically a user — but `room` owns the `Room` aggregate
// and never imports from `participants`, so this is declared independently
// rather than importing/extending it. Structurally identical on purpose.
//
// `vote` is an inline opaque primitive for the same reason: `room` doesn't
// care what a vote means (a card, a t-shirt size, whatever) — that's
// `voting`'s `VoteValue` (features/voting/domain/entities.ts), which room
// likewise never imports.
export interface RoomMember {
	id: string;
	name: string;
	isMaster: boolean;
	vote: string | number | null;
	joinedAt: number;
}

export interface Room {
	code: string;
	createdAt: number;
	lastActivityAt: number;
	masterId: string;
	question: string | null;
	status: RoundStatus;
	roundId: string;
	participants: Map<string, RoomMember>;
	// The team's agreed-upon number after discussing the votes in dispute —
	// distinct from `results.average`, which is only ever a suggestion. Only
	// numeric (never "?"/"☕"), and only ever one of that round's actual votes
	// — see room-operations.ts's selectFinalCard.
	finalCard: number | null;
}

export interface RoomSnapshot {
	code: string;
	status: RoundStatus;
	question: string | null;
	roundId: string;
	masterId: string;
	participants: Array<{
		id: string;
		name: string;
		isMaster: boolean;
		hasVoted: boolean;
		vote: string | number | null;
		connected: boolean;
	}>;
	results: {
		average: number | null;
		blocked: boolean;
		voteCount: number;
		distinctVotes: (string | number)[];
	} | null;
	finalCard: number | null;
}

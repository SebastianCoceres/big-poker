export type RoundStatus = "waiting" | "voting" | "revealed";

// A vote is an opaque primitive from `room`'s perspective — it doesn't care
// what it means (a card, a t-shirt size, whatever); that's `voting`'s job.
export type VoteValue = string | number;

export interface Participant {
	id: string;
	name: string;
	isMaster: boolean;
	vote: VoteValue | null;
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
	participants: Map<string, Participant>;
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
		vote: VoteValue | null;
		connected: boolean;
	}>;
	results: {
		average: number | null;
		blocked: boolean;
		voteCount: number;
	} | null;
}

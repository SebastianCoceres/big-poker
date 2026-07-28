import type { CardValue } from "./voting";

export type RoundStatus = "waiting" | "voting" | "revealed";

export interface Participant {
	id: string;
	name: string;
	isMaster: boolean;
	vote: CardValue | null;
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
		vote: CardValue | null;
		connected: boolean;
	}>;
	results: {
		average: number | null;
		blocked: boolean;
		voteCount: number;
	} | null;
}

export type RoomErrorCode =
	| "ROOM_NOT_FOUND"
	| "NOT_MASTER"
	| "INVALID_NAME"
	| "NAME_TAKEN"
	| "INVALID_QUESTION"
	| "INVALID_VOTE"
	| "STALE_ROUND"
	| "ROOM_CODE_EXHAUSTED"
	| "MASTER_CANNOT_LEAVE"
	| "CANNOT_KICK_SELF";

export type Result<T> =
	| { ok: true; data: T }
	| { ok: false; error: RoomErrorCode };

export interface JoinedRoom {
	participantId: string;
	snapshot: RoomSnapshot;
}

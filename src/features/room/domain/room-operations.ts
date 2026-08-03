import type { Room } from "./entities";
import type { Result } from "./result";

export function joinParticipant(room: Room, id: string, name: string): void {
	const existing = room.participants.get(id);
	if (existing) {
		// Idempotent: reconnecting/refreshing re-sends join with the same id.
		existing.name = name;
	} else {
		room.participants.set(id, {
			id,
			name,
			isMaster: id === room.masterId,
			vote: null,
			joinedAt: Date.now(),
		});
	}
	room.lastActivityAt = Date.now();
}

export function castVote(
	room: Room,
	participantId: string,
	vote: string | number,
): Result<void> {
	const participant = room.participants.get(participantId);
	// No seat in this room for this identity (should not happen in the normal
	// flow, since the client always joins before it can see the card board).
	if (!participant) return { ok: false, error: "ROOM_NOT_FOUND" };

	participant.vote = vote;
	room.lastActivityAt = Date.now();

	// Auto-reveal once every seat has a vote — same total the UI already shows
	// as "X de Y ya votaron" (QuestionPanel.tsx). Includes disconnected
	// participants on purpose: if one of them never votes, this never fires
	// and the master's manual "Revelar votos" stays the fallback.
	const allVoted = [...room.participants.values()].every(
		(p) => p.vote !== null,
	);
	if (allVoted) room.status = "revealed";

	return { ok: true, data: undefined };
}

export function selectFinalCard(
	room: Room,
	participantId: string,
	card: number,
): Result<void> {
	if (room.masterId !== participantId) {
		return { ok: false, error: "NOT_MASTER" };
	}
	// Only numeric votes are eligible — "?"/"☕" mean "can't estimate yet",
	// not a candidate for the team's agreed number.
	const numericVotes = new Set(
		[...room.participants.values()]
			.map((p) => p.vote)
			.filter((v): v is number => typeof v === "number"),
	);
	if (!numericVotes.has(card)) {
		return { ok: false, error: "INVALID_FINAL_CARD" };
	}
	room.finalCard = card;
	room.lastActivityAt = Date.now();
	return { ok: true, data: undefined };
}

export function kickParticipant(
	room: Room,
	requesterId: string,
	targetId: string,
): Result<boolean> {
	if (room.masterId !== requesterId) {
		return { ok: false, error: "NOT_MASTER" };
	}
	if (targetId === requesterId) {
		return { ok: false, error: "CANNOT_KICK_SELF" };
	}
	const removed = room.participants.delete(targetId);
	if (removed) room.lastActivityAt = Date.now();
	return { ok: true, data: removed };
}

export function leaveRoom(room: Room, participantId: string): Result<boolean> {
	// The master has no seat to hand off to — closing the room is the only way
	// out for them, mirrors reveal()/closeResult() requiring a role.
	if (room.masterId === participantId) {
		return { ok: false, error: "MASTER_CANNOT_LEAVE" };
	}
	// Idempotent no-op if already gone (double-click), mirrors
	// reveal/closeResult.
	const removed = room.participants.delete(participantId);
	if (removed) room.lastActivityAt = Date.now();
	return { ok: true, data: removed };
}

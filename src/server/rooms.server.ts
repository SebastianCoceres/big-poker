import { type CardValue, computeResults, isCardValue } from "#/lib/fibonacci";
import { generateRoomCode, normalizeRoomCode } from "#/lib/room-code";

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
	| "ROOM_CODE_EXHAUSTED";

export type Result<T> =
	| { ok: true; data: T }
	| { ok: false; error: RoomErrorCode };

type Send = (event: string, payload: unknown) => void;

interface Registry {
	rooms: Map<string, Room>;
	// Keyed by roomCode -> participantId -> active SSE senders. Per-participant
	// (not just per-room) so we can tell WHICH participants are connected
	// (drives the "disconnected" pill) and drop a single dead sender without
	// touching the rest of the room's subscribers.
	subscribers: Map<string, Map<string, Set<Send>>>;
	cleanupTimer?: ReturnType<typeof setInterval>;
	// Keyed by roomCode -> pending "close this empty room" timeout, separate
	// from the 6h sweep so a room with zero connected participants can be
	// closed on a much shorter, more intentional grace period.
	emptyRoomTimers: Map<string, ReturnType<typeof setTimeout>>;
}

// Guarded on globalThis so Vite's SSR module re-execution on file edits (dev
// HMR) doesn't reset an in-flight Map of live rooms.
const g = globalThis as unknown as { __bigPokerRegistry?: Registry };
const registry: Registry = g.__bigPokerRegistry ?? {
	rooms: new Map(),
	subscribers: new Map(),
	emptyRoomTimers: new Map(),
};
if (import.meta.env.DEV) g.__bigPokerRegistry = registry;

const ROOM_CODE_MAX_ATTEMPTS = 5;
const ROOM_TTL_MS = 6 * 60 * 60 * 1000;
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
// Grace period before an empty room (no connected subscribers) is closed —
// short enough to actually free the room promptly, long enough to survive a
// quick page refresh without losing the room. The 6h sweep above stays as a
// safety net for anything this misses.
const EMPTY_ROOM_GRACE_MS = 2 * 60 * 1000;

function cancelEmptyRoomTimer(code: string): void {
	const timer = registry.emptyRoomTimers.get(code);
	if (!timer) return;
	clearTimeout(timer);
	registry.emptyRoomTimers.delete(code);
}

function scheduleEmptyRoomCleanup(code: string): void {
	cancelEmptyRoomTimer(code);
	const timer = setTimeout(() => {
		registry.emptyRoomTimers.delete(code);
		const stillEmpty = (registry.subscribers.get(code)?.size ?? 0) === 0;
		if (stillEmpty) {
			registry.rooms.delete(code);
			registry.subscribers.delete(code);
		}
	}, EMPTY_ROOM_GRACE_MS);
	timer.unref?.();
	registry.emptyRoomTimers.set(code, timer);
}

function ensureCleanupTimer() {
	if (registry.cleanupTimer) return;
	const timer = setInterval(() => {
		const now = Date.now();
		for (const [code, room] of registry.rooms) {
			const hasSubscribers = (registry.subscribers.get(code)?.size ?? 0) > 0;
			if (!hasSubscribers && now - room.lastActivityAt > ROOM_TTL_MS) {
				registry.rooms.delete(code);
				registry.subscribers.delete(code);
			}
		}
	}, SWEEP_INTERVAL_MS);
	// Never keep the process alive just for this sweep.
	timer.unref?.();
	registry.cleanupTimer = timer;
}
ensureCleanupTimer();

function cleanText(value: string, maxLength: number): string | null {
	const trimmed = value.trim();
	if (trimmed.length < 1 || trimmed.length > maxLength) return null;
	return trimmed;
}

// Case-insensitive so "Ana" and "ana" still collide — two people with the
// same display name are indistinguishable once votes are revealed.
function isNameTaken(
	room: Room,
	name: string,
	excludeParticipantId: string,
): boolean {
	const normalized = name.toLowerCase();
	for (const p of room.participants.values()) {
		if (p.id === excludeParticipantId) continue;
		if (p.name.toLowerCase() === normalized) return true;
	}
	return false;
}

export function getRoom(code: string): Room | undefined {
	return registry.rooms.get(normalizeRoomCode(code));
}

function isConnected(code: string, participantId: string): boolean {
	return (registry.subscribers.get(code)?.get(participantId)?.size ?? 0) > 0;
}

// `viewerId` lets each participant always see their OWN vote before reveal
// (they already know what card they picked — hiding it from themselves only
// breaks reconnection/refresh, it doesn't add any privacy), while everyone
// else's vote stays hidden until the room is revealed.
function toSnapshot(room: Room, viewerId?: string): RoomSnapshot {
	const participants = [...room.participants.values()].map((p) => ({
		id: p.id,
		name: p.name,
		isMaster: p.isMaster,
		hasVoted: p.vote !== null,
		vote: room.status === "revealed" || p.id === viewerId ? p.vote : null,
		connected: isConnected(room.code, p.id),
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

export function toSnapshotForCode(
	code: string,
	viewerId: string,
): RoomSnapshot | undefined {
	const room = getRoom(code);
	return room ? toSnapshot(room, viewerId) : undefined;
}

function broadcast(code: string): void {
	const room = registry.rooms.get(code);
	if (!room) return;
	const byParticipant = registry.subscribers.get(code);
	if (!byParticipant) return;

	// Each participant gets their own snapshot (their vote visible to
	// themselves pre-reveal, everyone else's hidden) — not one shared object.
	for (const [participantId, senders] of byParticipant) {
		const snapshot = toSnapshot(room, participantId);
		for (const send of senders) {
			try {
				send("snapshot", snapshot);
			} catch {
				// The stream is already dead but its cancel()/abort handler hasn't
				// fired yet — drop it here instead of letting one broken connection
				// break the broadcast for the rest of the room.
				senders.delete(send);
			}
		}
		if (senders.size === 0) byParticipant.delete(participantId);
	}
}

/** Registers a live SSE sender for a participant. Returns an unsubscribe fn. */
export function subscribe(
	code: string,
	participantId: string,
	send: Send,
): () => void {
	// Someone (re)connected — cancel any pending "close this empty room" timer
	// (e.g. a quick page refresh that briefly dropped the last connection).
	cancelEmptyRoomTimer(code);

	let byParticipant = registry.subscribers.get(code);
	if (!byParticipant) {
		byParticipant = new Map();
		registry.subscribers.set(code, byParticipant);
	}
	let senders = byParticipant.get(participantId);
	if (!senders) {
		senders = new Set();
		byParticipant.set(participantId, senders);
	}
	senders.add(send);
	// A participant's connection state is part of every snapshot (drives the
	// "disconnected" pill/banner) — broadcast so tabs already open (not just
	// the one connecting/disconnecting) find out promptly, not only on the
	// next unrelated mutation.
	broadcast(code);

	return () => {
		senders?.delete(send);
		if (senders && senders.size === 0) byParticipant?.delete(participantId);
		if ((byParticipant?.size ?? 0) === 0) scheduleEmptyRoomCleanup(code);
		broadcast(code);
	};
}

function generateUniqueRoomCode(): Result<string> {
	for (let i = 0; i < ROOM_CODE_MAX_ATTEMPTS; i++) {
		const code = generateRoomCode();
		if (!registry.rooms.has(code)) return { ok: true, data: code };
	}
	return { ok: false, error: "ROOM_CODE_EXHAUSTED" };
}

export function createRoom(
	participantId: string,
	name: string,
): Result<RoomSnapshot> {
	const cleanName = cleanText(name, 30);
	if (!cleanName) return { ok: false, error: "INVALID_NAME" };

	const codeResult = generateUniqueRoomCode();
	if (!codeResult.ok) return codeResult;

	const now = Date.now();
	const room: Room = {
		code: codeResult.data,
		createdAt: now,
		lastActivityAt: now,
		masterId: participantId,
		question: null,
		status: "waiting",
		roundId: crypto.randomUUID(),
		participants: new Map([
			[
				participantId,
				{
					id: participantId,
					name: cleanName,
					isMaster: true,
					vote: null,
					joinedAt: now,
				},
			],
		]),
	};
	registry.rooms.set(room.code, room);
	return { ok: true, data: toSnapshot(room) };
}

export function joinRoom(
	code: string,
	participantId: string,
	name: string,
): Result<RoomSnapshot> {
	const room = getRoom(code);
	if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };

	const cleanName = cleanText(name, 30);
	if (!cleanName) return { ok: false, error: "INVALID_NAME" };
	if (isNameTaken(room, cleanName, participantId)) {
		return { ok: false, error: "NAME_TAKEN" };
	}

	const existing = room.participants.get(participantId);
	if (existing) {
		// Idempotent: reconnecting/refreshing re-sends join with the same id.
		existing.name = cleanName;
	} else {
		room.participants.set(participantId, {
			id: participantId,
			name: cleanName,
			isMaster: participantId === room.masterId,
			vote: null,
			joinedAt: Date.now(),
		});
	}
	room.lastActivityAt = Date.now();
	broadcast(room.code);
	return { ok: true, data: toSnapshot(room) };
}

export function startRound(
	code: string,
	participantId: string,
	question: string,
): Result<RoomSnapshot> {
	const room = getRoom(code);
	if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };
	if (room.masterId !== participantId)
		return { ok: false, error: "NOT_MASTER" };

	const cleanQuestion = cleanText(question, 300);
	if (!cleanQuestion) return { ok: false, error: "INVALID_QUESTION" };

	room.question = cleanQuestion;
	room.status = "voting";
	room.roundId = crypto.randomUUID();
	for (const p of room.participants.values()) p.vote = null;
	room.lastActivityAt = Date.now();
	broadcast(room.code);
	return { ok: true, data: toSnapshot(room) };
}

export function castVote(
	code: string,
	participantId: string,
	roundId: string,
	card: CardValue,
): Result<RoomSnapshot> {
	const room = getRoom(code);
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
	// No seat in this room for this identity (should not happen in the normal
	// flow, since the client always joins before it can see the card board).
	if (!participant) return { ok: false, error: "ROOM_NOT_FOUND" };

	participant.vote = card;
	room.lastActivityAt = Date.now();

	// Auto-reveal once every seat has a vote — same total the UI already shows
	// as "X de Y ya votaron" (QuestionPanel.tsx). Includes disconnected
	// participants on purpose: if one of them never votes, this never fires
	// and the master's manual "Revelar votos" stays the fallback.
	const allVoted = [...room.participants.values()].every(
		(p) => p.vote !== null,
	);
	if (allVoted) room.status = "revealed";

	broadcast(room.code);
	return { ok: true, data: toSnapshot(room) };
}

export function reveal(
	code: string,
	participantId: string,
): Result<RoomSnapshot> {
	const room = getRoom(code);
	if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };
	if (room.masterId !== participantId)
		return { ok: false, error: "NOT_MASTER" };

	// Idempotent no-op outside "voting" (e.g. double-click, or clicked before
	// any round started) rather than a hard error — the UI only shows the
	// reveal control during voting anyway.
	if (room.status === "voting") {
		room.status = "revealed";
		room.lastActivityAt = Date.now();
		broadcast(room.code);
	}
	return { ok: true, data: toSnapshot(room) };
}

export function closeResult(
	code: string,
	participantId: string,
): Result<RoomSnapshot> {
	const room = getRoom(code);
	if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };
	if (room.masterId !== participantId)
		return { ok: false, error: "NOT_MASTER" };

	// Idempotent no-op outside "revealed" (double-click), mirrors reveal().
	// Deliberately does NOT clear room.question — QuestionPanel uses its
	// presence to say "Nueva pregunta" vs "Primera pregunta" on the next
	// round's form, and clearing it here would wrongly reset that label.
	if (room.status === "revealed") {
		room.status = "waiting";
		room.lastActivityAt = Date.now();
		broadcast(room.code);
	}
	return { ok: true, data: toSnapshot(room) };
}

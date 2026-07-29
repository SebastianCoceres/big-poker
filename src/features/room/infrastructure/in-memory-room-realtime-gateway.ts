import type {
	RoomRealtimeGateway,
	RoomRepository,
	Send,
	Unsubscribe,
	VoteScorer,
} from "../application/ports";
import { broadcastRoomSnapshot } from "../application/snapshot-broadcast";
import type { RoomSnapshot } from "../domain/entities";

const ROOM_TTL_MS = 6 * 60 * 60 * 1000;
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
// Grace period before an empty room (no connected subscribers) is closed —
// short enough to actually free the room promptly, long enough to survive a
// quick page refresh without losing the room. The 6h sweep above stays as a
// safety net for anything this misses.
const EMPTY_ROOM_GRACE_MS = 2 * 60 * 1000;
// Grace period before a single disconnected participant is pruned from the
// roster — shorter than EMPTY_ROOM_GRACE_MS since EventSource's own built-in
// retry reconnects within a few seconds on a transient drop; this just covers
// that window plus some slack, not a full page-refresh-level grace.
const PARTICIPANT_LEAVE_GRACE_MS = 20 * 1000;

/**
 * In-memory realtime transport for rooms: tracks live SSE senders per
 * (roomCode, participantId) and owns the three grace-period timers that used
 * to live directly in rooms.server.ts. Needs a RoomRepository reference so
 * its own timers can prune ghost participants / abandoned rooms without
 * going through a use case.
 */
export class InMemoryRoomRealtimeGateway implements RoomRealtimeGateway {
	// Keyed by roomCode -> participantId -> active SSE senders. Per-participant
	// (not just per-room) so we can tell WHICH participants are connected
	// (drives the "disconnected" pill) and drop a single dead sender without
	// touching the rest of the room's subscribers.
	private readonly subscribers = new Map<string, Map<string, Set<Send>>>();
	private cleanupTimer?: ReturnType<typeof setInterval>;
	// Keyed by roomCode -> pending "close this empty room" timeout, separate
	// from the 6h sweep so a room with zero connected participants can be
	// closed on a much shorter, more intentional grace period.
	private readonly emptyRoomTimers = new Map<
		string,
		ReturnType<typeof setTimeout>
	>();
	// Keyed by `${roomCode}:${participantId}` -> pending "remove this ghost
	// participant" timeout. A participant losing their SSE connection (tab
	// closed, network drop) doesn't mean they left for good — a page refresh
	// looks identical from the server's side until the reconnect either shows
	// up (timer gets cancelled) or doesn't (timer fires and prunes them).
	private readonly participantLeaveTimers = new Map<
		string,
		ReturnType<typeof setTimeout>
	>();

	constructor(
		private readonly rooms: RoomRepository,
		private readonly voteScorer: VoteScorer,
	) {
		this.ensureCleanupTimer();
	}

	subscribe(code: string, participantId: string, send: Send): Unsubscribe {
		// Someone (re)connected — cancel any pending "close this empty room"
		// timer (e.g. a quick page refresh that briefly dropped the last
		// connection).
		this.cancelEmptyRoomTimer(code);
		// This specific participant is back — cancel their pending
		// ghost-removal.
		this.cancelParticipantLeaveTimer(code, participantId);

		let byParticipant = this.subscribers.get(code);
		if (!byParticipant) {
			byParticipant = new Map();
			this.subscribers.set(code, byParticipant);
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
		this.broadcast(code);

		return () => {
			senders?.delete(send);
			if (senders && senders.size === 0) {
				byParticipant?.delete(participantId);
				this.scheduleParticipantRemoval(code, participantId);
			}
			if ((byParticipant?.size ?? 0) === 0) this.scheduleEmptyRoomCleanup(code);
			this.broadcast(code);
		};
	}

	isConnected(code: string, participantId: string): boolean {
		return (this.subscribers.get(code)?.get(participantId)?.size ?? 0) > 0;
	}

	publishSnapshot(
		code: string,
		participantId: string,
		snapshot: RoomSnapshot,
	): void {
		const byParticipant = this.subscribers.get(code);
		const senders = byParticipant?.get(participantId);
		if (!senders) return;
		for (const send of senders) {
			try {
				send("snapshot", snapshot);
			} catch {
				// The stream is already dead but its cancel()/abort handler hasn't
				// fired yet — drop it here instead of letting one broken
				// connection break the broadcast for the rest of the room.
				senders.delete(send);
			}
		}
		if (senders.size === 0) byParticipant?.delete(participantId);
	}

	publishToAll(code: string, event: string, payload: unknown): void {
		const byParticipant = this.subscribers.get(code);
		if (!byParticipant) return;
		for (const senders of byParticipant.values()) {
			for (const send of senders) {
				try {
					send(event, payload);
				} catch {
					// Stream already dead — nothing to notify.
				}
			}
		}
	}

	publishTo(
		code: string,
		participantId: string,
		event: string,
		payload: unknown,
	): void {
		const senders = this.subscribers.get(code)?.get(participantId);
		if (!senders) return;
		for (const send of senders) {
			try {
				send(event, payload);
			} catch {
				// Stream already dead — nothing to notify.
			}
		}
	}

	releaseRoom(code: string): void {
		this.cancelEmptyRoomTimer(code);
		const prefix = `${code}:`;
		for (const key of [...this.participantLeaveTimers.keys()]) {
			if (!key.startsWith(prefix)) continue;
			clearTimeout(this.participantLeaveTimers.get(key));
			this.participantLeaveTimers.delete(key);
		}
		this.subscribers.delete(code);
	}

	private broadcast(code: string): void {
		const room = this.rooms.findByCode(code);
		if (!room) return;
		broadcastRoomSnapshot(this, room, this.voteScorer);
	}

	private participantLeaveTimerKey(
		code: string,
		participantId: string,
	): string {
		return `${code}:${participantId}`;
	}

	private cancelParticipantLeaveTimer(
		code: string,
		participantId: string,
	): void {
		const key = this.participantLeaveTimerKey(code, participantId);
		const timer = this.participantLeaveTimers.get(key);
		if (!timer) return;
		clearTimeout(timer);
		this.participantLeaveTimers.delete(key);
	}

	private scheduleParticipantRemoval(
		code: string,
		participantId: string,
	): void {
		this.cancelParticipantLeaveTimer(code, participantId);
		const key = this.participantLeaveTimerKey(code, participantId);
		const timer = setTimeout(() => {
			this.participantLeaveTimers.delete(key);
			// Reconnected during the grace period — nothing to prune.
			if (this.isConnected(code, participantId)) return;
			const room = this.rooms.findByCode(code);
			if (!room) return;
			if (room.participants.delete(participantId)) {
				room.lastActivityAt = Date.now();
				this.rooms.save(room);
				this.broadcast(code);
			}
		}, PARTICIPANT_LEAVE_GRACE_MS);
		timer.unref?.();
		this.participantLeaveTimers.set(key, timer);
	}

	private cancelEmptyRoomTimer(code: string): void {
		const timer = this.emptyRoomTimers.get(code);
		if (!timer) return;
		clearTimeout(timer);
		this.emptyRoomTimers.delete(code);
	}

	private scheduleEmptyRoomCleanup(code: string): void {
		this.cancelEmptyRoomTimer(code);
		const timer = setTimeout(() => {
			this.emptyRoomTimers.delete(code);
			const stillEmpty = (this.subscribers.get(code)?.size ?? 0) === 0;
			if (stillEmpty) {
				this.rooms.delete(code);
				this.subscribers.delete(code);
			}
		}, EMPTY_ROOM_GRACE_MS);
		timer.unref?.();
		this.emptyRoomTimers.set(code, timer);
	}

	private ensureCleanupTimer(): void {
		if (this.cleanupTimer) return;
		const timer = setInterval(() => {
			const now = Date.now();
			for (const room of this.rooms.listAll()) {
				const hasSubscribers = (this.subscribers.get(room.code)?.size ?? 0) > 0;
				if (!hasSubscribers && now - room.lastActivityAt > ROOM_TTL_MS) {
					this.rooms.delete(room.code);
					this.subscribers.delete(room.code);
				}
			}
		}, SWEEP_INTERVAL_MS);
		// Never keep the process alive just for this sweep.
		timer.unref?.();
		this.cleanupTimer = timer;
	}
}

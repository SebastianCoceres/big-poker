import type { Room, RoomSnapshot } from "../domain/entities";

export type Send = (event: string, payload: unknown) => void;
export type Unsubscribe = () => void;

/**
 * Persistence for the `Room` aggregate only — no timers, no pub/sub. Those
 * are the `RoomRealtimeGateway`'s job.
 */
export interface RoomRepository {
	findByCode(code: string): Room | undefined;
	save(room: Room): void;
	delete(code: string): void;
	/**
	 * Beyond the plan's literal 3-method sketch: needed by the infrastructure
	 * gateway's periodic 6h sweep (`ensureCleanupTimer` in the original
	 * `rooms.server.ts`), which has to walk every room to find abandoned ones.
	 * There is no way to preserve that behavior without some form of
	 * enumeration on the repository.
	 */
	listAll(): Room[];
}

/**
 * Real-time transport for a room: who is subscribed, and how to push events
 * to them. Deliberately knows nothing about domain rules — use cases decide
 * *when* to publish, this port only knows *how*.
 */
export interface RoomRealtimeGateway {
	/** Registers a live sender for a participant. Returns an unsubscribe fn. */
	subscribe(code: string, participantId: string, send: Send): Unsubscribe;
	isConnected(code: string, participantId: string): boolean;
	/** Delivers a precomputed, viewer-scoped snapshot to one participant. */
	publishSnapshot(
		code: string,
		participantId: string,
		snapshot: RoomSnapshot,
	): void;
	/** Used by closeRoom for the `"closed"` event. */
	publishToAll(code: string, event: string, payload: unknown): void;
	/** Used by kickParticipant for the `"kicked"` event. */
	publishTo(
		code: string,
		participantId: string,
		event: string,
		payload: unknown,
	): void;
	/**
	 * Beyond the plan's literal 5-method sketch: releases everything the
	 * gateway holds for a room (pending grace timers, subscriber entries) the
	 * moment it's closed, mirroring the original `closeRoom`'s explicit
	 * `cancelEmptyRoomTimer` / `cancelParticipantLeaveTimer` / subscribers
	 * cleanup. Not strictly required for correctness (every timer callback
	 * already no-ops once `RoomRepository.findByCode` returns nothing) but
	 * kept for parity — same resource hygiene as the code it replaces.
	 */
	releaseRoom(code: string): void;
}

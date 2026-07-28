import type { Room, RoomSnapshot } from "../domain/entities";
import { buildSnapshot } from "../domain/snapshot";
import type { RoomRealtimeGateway } from "./ports";

/** Which of `room`'s seated participants currently have a live connection. */
export function connectedParticipantIds(
	realtime: RoomRealtimeGateway,
	room: Room,
): Set<string> {
	return new Set(
		[...room.participants.keys()].filter((id) =>
			realtime.isConnected(room.code, id),
		),
	);
}

/** A single viewer-scoped snapshot, resolved against real connection state. */
export function snapshotWithConnections(
	realtime: RoomRealtimeGateway,
	room: Room,
	viewerId?: string,
): RoomSnapshot {
	return buildSnapshot(room, connectedParticipantIds(realtime, room), viewerId);
}

/**
 * Sends every currently-seated participant their own personalized snapshot
 * (their vote visible pre-reveal, everyone else's hidden) — not one shared
 * object per room.
 *
 * Iterating `room.participants` (the domain's source of truth) rather than
 * the gateway's own subscriber map is what makes the original code's
 * "remove the subscriber entry before broadcasting" ordering trick for
 * kick/leave unnecessary here: a participant already removed from
 * `room.participants` structurally cannot receive a `publishSnapshot` call
 * from this loop, regardless of whether their gateway subscription has been
 * torn down yet.
 */
export function broadcastRoomSnapshot(
	realtime: RoomRealtimeGateway,
	room: Room,
): void {
	const connectedIds = connectedParticipantIds(realtime, room);
	for (const participant of room.participants.values()) {
		realtime.publishSnapshot(
			room.code,
			participant.id,
			buildSnapshot(room, connectedIds, participant.id),
		);
	}
}

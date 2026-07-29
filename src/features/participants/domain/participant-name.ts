import type { Room } from "#/features/room/domain/entities";

// Case-insensitive so "Ana" and "ana" still collide — two people with the
// same display name are indistinguishable once votes are revealed.
export function isNameTaken(
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

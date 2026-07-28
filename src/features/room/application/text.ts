import type { Room } from "../domain/entities";

export function cleanText(value: string, maxLength: number): string | null {
	const trimmed = value.trim();
	if (trimmed.length < 1 || trimmed.length > maxLength) return null;
	return trimmed;
}

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

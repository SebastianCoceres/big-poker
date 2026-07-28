import type { RoomRepository } from "../application/ports";
import type { Room } from "../domain/entities";
import { normalizeRoomCode } from "../domain/room-code";

export class InMemoryRoomRepository implements RoomRepository {
	private readonly rooms = new Map<string, Room>();

	findByCode(code: string): Room | undefined {
		return this.rooms.get(normalizeRoomCode(code));
	}

	save(room: Room): void {
		this.rooms.set(room.code, room);
	}

	delete(code: string): void {
		this.rooms.delete(normalizeRoomCode(code));
	}

	listAll(): Room[] {
		return [...this.rooms.values()];
	}
}

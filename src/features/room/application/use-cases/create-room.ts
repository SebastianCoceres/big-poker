import type { Room } from "../../domain/entities";
import type { Result } from "../../domain/result";
import { generateRoomCode } from "../../domain/room-code";
import { buildSnapshot } from "../../domain/snapshot";
import type { JoinedRoom } from "../dtos";
import type { RoomRepository } from "../ports";
import { cleanText } from "../text";

const ROOM_CODE_MAX_ATTEMPTS = 5;

// Identity is minted here, not on the client: `crypto.randomUUID()` is only
// exposed by browsers in secure contexts (HTTPS, or localhost), so a phone
// joining over plain HTTP on a LAN IP would otherwise have no way to
// generate one. Node's `crypto` has no such restriction.
export class CreateRoomUseCase {
	constructor(private readonly rooms: RoomRepository) {}

	execute(name: string): Result<JoinedRoom> {
		const cleanName = cleanText(name, 30);
		if (!cleanName) return { ok: false, error: "INVALID_NAME" };

		const codeResult = this.generateUniqueRoomCode();
		if (!codeResult.ok) return codeResult;

		const participantId = crypto.randomUUID();
		const now = Date.now();
		const room: Room = {
			code: codeResult.data,
			createdAt: now,
			lastActivityAt: now,
			masterId: participantId,
			question: null,
			status: "waiting",
			roundId: crypto.randomUUID(),
			finalCard: null,
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
		this.rooms.save(room);
		// No RoomRealtimeGateway dependency needed here: a room's code is only
		// known to its creator after this call returns, so nothing could
		// possibly be subscribed yet — an empty connected set is provably (not
		// just practically) equivalent to querying real connection state.
		return {
			ok: true,
			data: { participantId, snapshot: buildSnapshot(room, new Set(), null) },
		};
	}

	private generateUniqueRoomCode(): Result<string> {
		for (let i = 0; i < ROOM_CODE_MAX_ATTEMPTS; i++) {
			const code = generateRoomCode();
			if (!this.rooms.findByCode(code)) return { ok: true, data: code };
		}
		return { ok: false, error: "ROOM_CODE_EXHAUSTED" };
	}
}

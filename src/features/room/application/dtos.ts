import type { RoomSnapshot } from "../domain/entities";

// Return shape of the create-room/join-room use cases — not a domain entity,
// it's how `application` hands the caller both the new participant's id and
// the resulting snapshot in one shot.
export interface JoinedRoom {
	participantId: string;
	snapshot: RoomSnapshot;
}

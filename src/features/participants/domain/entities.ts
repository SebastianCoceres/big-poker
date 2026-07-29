/**
 * A Participant is the real entity — basically a user: someone who joined a
 * room. `room`'s own `RoomMember` (features/room/domain/entities.ts) is
 * exactly this shape — a RoomMember IS a Participant, not the other way
 * around — but `room` owns the `Room` aggregate and never depends on
 * `participants`, no matter which side conceptually "owns" the idea.
 *
 * `participants` CAN depend on `room` (the sanctioned direction), so instead
 * of redeclaring the same fields twice and risking the two drifting apart,
 * this re-exports room's type under participants' own name — one
 * definition, room's, consumed here under the vocabulary this feature's own
 * code actually reads in.
 */
export type { RoomMember as Participant } from "#/features/room/domain/entities";

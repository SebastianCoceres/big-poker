export const FIBONACCI_SCALE = [0, 1, 2, 3, 5, 8, 13, 21] as const;
export type NumericCard = (typeof FIBONACCI_SCALE)[number];

export const SPECIAL_CARDS = ["?", "☕"] as const;
export type SpecialCard = (typeof SPECIAL_CARDS)[number];

export type CardValue = NumericCard | SpecialCard;

// voting's own name for a vote's value — `room` only ever sees this as an
// opaque `string | number` (see room/domain/entities.ts's RoomMember.vote);
// this is where the concept itself actually lives.
export type VoteValue = CardValue;

export const CARD_VALUES: readonly CardValue[] = [
	...FIBONACCI_SCALE,
	...SPECIAL_CARDS,
];

export interface RoundResults {
	average: NumericCard | null;
	blocked: boolean;
	voteCount: number;
}

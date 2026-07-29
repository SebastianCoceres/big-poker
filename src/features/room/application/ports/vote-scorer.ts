import type { VoteValue } from "../../domain/entities";

/**
 * `room` needs to know the aggregate result of a round (average, whether it's
 * blocked, how many votes) to build a complete `RoomSnapshot`, but scoring
 * votes is `voting`'s domain — this port lets `room` depend on the shape of
 * that computation without depending on `voting` itself. The composition root
 * is the only place that wires a concrete implementation in.
 */
export interface VoteScorer {
	score(votes: VoteValue[]): {
		average: number | null;
		blocked: boolean;
		voteCount: number;
	};
}

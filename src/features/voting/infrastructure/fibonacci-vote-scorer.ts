import type { VoteScorer } from "#/features/room/application/ports";
import type { CardValue } from "../domain/entities";
import { computeResults } from "../domain/voting";

/**
 * The only concrete `VoteScorer` — wired in by the composition root
 * (`app/container.ts`), which is the one place allowed to know both `room`'s
 * `VoteScorer` port and `voting`'s scoring logic.
 */
export class FibonacciVoteScorer implements VoteScorer {
	score(votes: (string | number)[]) {
		// Safe here because `voting` is the one who validates votes with
		// `isCardValue` before they ever enter a room (see cast-vote.ts) — by
		// the time a vote reaches this scorer, it's already a `CardValue`.
		return computeResults(votes as CardValue[]);
	}
}

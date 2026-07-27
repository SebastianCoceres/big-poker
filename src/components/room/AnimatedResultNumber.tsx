import NumberFlow from "@number-flow/react";
import { useEffect, useState } from "react";
import { FIBONACCI_SCALE } from "#/lib/fibonacci";

const CYCLE_DURATION_MS = 700;
const CYCLE_INTERVAL_MS = 110;

export function AnimatedResultNumber({
	value,
	roundId,
}: {
	// snapshot.results.average is typed as `number | null` on RoomSnapshot
	// (broader than the NumericCard union RoundResults uses server-side) — kept
	// as `number` here to match what actually arrives from the snapshot.
	value: number;
	roundId: string;
}) {
	const [display, setDisplay] = useState<number>(value);

	// roundId isn't read in the body, but must stay a dependency so revealing
	// the same numeric average twice in a row (two different rounds) still
	// replays the cycle instead of skipping it.
	// biome-ignore lint/correctness/useExhaustiveDependencies: see comment above
	useEffect(() => {
		const startedAt = Date.now();
		// Each tick lands on a new random value while NumberFlow is still mid-
		// roll from the previous one — that interruption is what produces the
		// continuous "slot machine" spin instead of discrete jumps. The final
		// tick always lands on the real average.
		const interval = setInterval(() => {
			if (Date.now() - startedAt >= CYCLE_DURATION_MS) {
				clearInterval(interval);
				setDisplay(value);
				return;
			}
			setDisplay(
				FIBONACCI_SCALE[Math.floor(Math.random() * FIBONACCI_SCALE.length)],
			);
		}, CYCLE_INTERVAL_MS);
		return () => clearInterval(interval);
	}, [value, roundId]);

	return (
		<NumberFlow
			value={display}
			willChange
			trend={1}
			className="display-title text-blue-deep text-6xl font-bold leading-none sm:text-7xl"
		/>
	);
}

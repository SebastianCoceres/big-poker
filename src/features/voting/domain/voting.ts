import {
	type CardValue,
	FIBONACCI_SCALE,
	type NumericCard,
	type RoundResults,
	SPECIAL_CARDS,
} from "./entities";

export function isCardValue(value: unknown): value is CardValue {
	if (typeof value === "number") {
		return (FIBONACCI_SCALE as readonly number[]).includes(value);
	}
	if (typeof value === "string") {
		return (SPECIAL_CARDS as readonly string[]).includes(value);
	}
	return false;
}

export function roundUpToFibonacci(value: number): NumericCard {
	const max = FIBONACCI_SCALE[FIBONACCI_SCALE.length - 1];
	if (value <= FIBONACCI_SCALE[0]) return FIBONACCI_SCALE[0];
	if (value > max) return max;
	return FIBONACCI_SCALE.find((f) => f >= value) ?? max;
}

export function computeResults(votes: CardValue[]): RoundResults {
	if (votes.length === 0)
		return { average: null, blocked: false, voteCount: 0 };
	if (votes.some((v) => v === "?" || v === "☕")) {
		return { average: null, blocked: true, voteCount: votes.length };
	}
	const numeric = votes as NumericCard[];
	const mean =
		numeric.reduce((sum: number, card) => sum + card, 0) / numeric.length;
	return {
		average: roundUpToFibonacci(mean),
		blocked: false,
		voteCount: numeric.length,
	};
}

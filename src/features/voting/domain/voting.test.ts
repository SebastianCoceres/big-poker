import { describe, expect, it } from "vitest";
import { computeResults, roundUpToFibonacci } from "./voting";

describe("roundUpToFibonacci", () => {
	it("rounds a mean up to the nearest Fibonacci value", () => {
		expect(roundUpToFibonacci(4)).toBe(5);
		expect(roundUpToFibonacci(5)).toBe(5);
		expect(roundUpToFibonacci(0)).toBe(0);
		expect(roundUpToFibonacci(-3)).toBe(0);
		expect(roundUpToFibonacci(1000)).toBe(21);
	});
});

describe("computeResults", () => {
	it("returns null/empty for no votes", () => {
		expect(computeResults([])).toEqual({
			average: null,
			blocked: false,
			voteCount: 0,
			distinctVotes: [],
		});
	});

	it("blocks (no average) when any vote is a discussion card", () => {
		expect(computeResults([1, 2, "?"])).toEqual({
			average: null,
			blocked: true,
			voteCount: 3,
			distinctVotes: [1, 2, "?"],
		});
		expect(computeResults(["☕"])).toMatchObject({ blocked: true });
	});

	it("averages numeric votes and rounds up", () => {
		expect(computeResults([1, 2, 3])).toEqual({
			average: 2, // mean is 2, and 2 is itself a Fibonacci value
			blocked: false,
			voteCount: 3,
			distinctVotes: [1, 2, 3],
		});
		expect(computeResults([2, 3, 5])).toEqual({
			average: 5, // mean 3.33 rounds up to the next Fibonacci value
			blocked: false,
			voteCount: 3,
			distinctVotes: [2, 3, 5],
		});
	});

	it("dedupes repeated votes and orders them by the card scale", () => {
		expect(computeResults([5, 1, 5, 1, 8])).toMatchObject({
			distinctVotes: [1, 5, 8],
		});
	});
});

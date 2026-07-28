import { useMemo, useState } from "react";
import Stack from "#/components/Stack";
import { CARD_VALUES, type CardValue } from "#/lib/fibonacci";
import { castVoteFn } from "#/server/rooms.functions";
import type { RoomSnapshot } from "#/server/rooms.server";

type SendState = "idle" | "sending" | "error";

const VOTE_TIMEOUT_MS = 8_000;

// Stack renders the LAST array entry frontmost, and dragging a card sends it
// to array index 0 (the back) — reversing our ascending scale here means
// dragging the front card away always reveals the next-higher value, so
// browsing the deck goes 0 -> 1 -> 2 -> ... -> ☕.
const STACK_ORDER: CardValue[] = [...CARD_VALUES].reverse();

function CardFace({ value }: { value: CardValue }) {
	return (
		<div className="playing-card text-ink flex h-full w-full select-none items-center justify-center border-2 p-0 text-3xl font-bold">
			{value}
		</div>
	);
}

// Only ever rendered while snapshot.status === "voting" (the parent route
// unmounts it otherwise) — no "revealed/disabled" branch needed here.
export function CardBoard({
	code,
	participantId,
	snapshot,
}: {
	code: string;
	participantId: string;
	snapshot: RoomSnapshot;
}) {
	const [sendState, setSendState] = useState<SendState>("idle");
	const [lastAttempt, setLastAttempt] = useState<CardValue | null>(null);

	const me = snapshot.participants.find((p) => p.id === participantId);
	// The snapshot always reveals MY OWN vote to me (never anyone else's
	// pre-reveal), so this survives a refresh mid-round without local state.
	const myVote = me?.vote ?? null;

	// Stable across re-renders (e.g. every SSE snapshot from someone else
	// voting) — otherwise Stack's `cards` effect would reset the deck to its
	// starting order mid-browse every time anything in the room changes.
	const stackCards = useMemo(
		() => STACK_ORDER.map((value) => <CardFace key={value} value={value} />),
		[],
	);

	async function pick(card: CardValue) {
		setLastAttempt(card);
		setSendState("sending");
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), VOTE_TIMEOUT_MS);
		try {
			const result = await castVoteFn({
				data: { code, participantId, roundId: snapshot.roundId, card },
				signal: controller.signal,
			});
			if (!result.ok) {
				// A stale round means the master already moved on — by the time
				// this response arrives the SSE snapshot already reflects the new
				// round, so there is nothing useful to show the user here.
				if (result.error === "STALE_ROUND") return;
				setSendState("error");
				return;
			}
			setSendState("idle");
		} catch {
			// Network drop mid-request: don't assume the vote landed.
			setSendState("error");
		} finally {
			clearTimeout(timeout);
		}
	}

	function handleFrontCardClick(index: number) {
		if (sendState === "sending") return;
		pick(STACK_ORDER[index]);
	}

	return (
		<div className="rise-in flex flex-1 flex-col items-center justify-center gap-4">
			<div className="w-full text-center">
				<h2 className="heading-sm">{snapshot.question}</h2>
				<p className="text-muted mt-1 text-sm">
					{myVote !== null ? (
						<>
							Tu voto: <strong className="text-ink">{myVote}</strong>
						</>
					) : (
						"Arrastrá para ver las cartas, tocá la de arriba para votar."
					)}
				</p>
			</div>
			{sendState === "error" && (
				<p className="text-danger flex items-center gap-2 text-sm">
					No pudimos confirmar tu voto.
					<button
						type="button"
						className="font-semibold underline"
						onClick={() => lastAttempt !== null && pick(lastAttempt)}
					>
						Reintentar
					</button>
				</p>
			)}
			<div className="h-56 w-40">
				<Stack
					cards={stackCards}
					onFrontCardClick={handleFrontCardClick}
					sensitivity={100}
					randomRotation
				/>
			</div>
		</div>
	);
}

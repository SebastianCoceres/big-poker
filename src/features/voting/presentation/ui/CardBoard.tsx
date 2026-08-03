import { useMemo, useState } from "react";
import type { RoomSnapshot } from "#/features/room/domain/entities";
import { CARD_VALUES, type CardValue } from "#/features/voting/domain/entities";
import { castVoteFn } from "#/features/voting/infrastructure/voting.controllers";
import { CardFace } from "#/features/voting/presentation/ui/CardFace";
import { Button } from "#/shared/ui/Button";
import Stack from "#/shared/ui/Stack";

type SendState = "idle" | "sending" | "error";

const VOTE_TIMEOUT_MS = 8_000;

// Stack renders the LAST array entry frontmost, and dragging a card sends it
// to array index 0 (the back) — reversing our ascending scale here means
// dragging the front card away always reveals the next-higher value, so
// browsing the deck goes 0 -> 1 -> 2 -> ... -> ☕.
const STACK_ORDER: CardValue[] = [...CARD_VALUES].reverse();

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
	const [armedIndex, setArmedIndex] = useState<number | null>(null);

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
		// Arm/lift the tapped card — submitting now happens via the
		// "Confirmar" button, not a second tap.
		setArmedIndex(index);
	}

	function handleFrontCardDragAway(index: number) {
		setArmedIndex((current) => (current === index ? null : current));
	}

	function handleConfirm() {
		if (armedIndex === null || sendState === "sending") return;
		const index = armedIndex;
		setArmedIndex(null);
		pick(STACK_ORDER[index]);
	}

	return (
		<div className="rise-in flex flex-1 flex-col items-center justify-center gap-4">
			<div className="w-full text-center">
				<h2 className="heading-sm">{snapshot.question}</h2>
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
			<div className="h-72 w-50">
				<Stack
					cards={stackCards}
					onFrontCardClick={handleFrontCardClick}
					onFrontCardDragAway={handleFrontCardDragAway}
					armedIndex={armedIndex}
					sensitivity={100}
					randomRotation
				/>
			</div>
			{armedIndex !== null ? (
				<div className="flex flex-col items-center gap-2">
					<p className="text-muted text-sm">
						Elegiste{" "}
						<strong className="text-ink">{STACK_ORDER[armedIndex]}</strong>
					</p>
					<Button onClick={handleConfirm} disabled={sendState === "sending"}>
						Confirmar
					</Button>
				</div>
			) : (
				myVote !== null && (
					<p className="text-muted mt-1 text-sm">
						Tu voto: <strong className="text-ink">{myVote}</strong>
					</p>
				)
			)}
		</div>
	);
}

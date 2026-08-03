import { useMemo, useState } from "react";
import bigtechLogo from "#/assets/bigtechlogo.png";
import type { RoomSnapshot } from "#/features/room/domain/entities";
import { CARD_VALUES, type CardValue } from "#/features/voting/domain/entities";
import { castVoteFn } from "#/features/voting/infrastructure/voting.controllers";
import Stack from "#/shared/ui/Stack";

type SendState = "idle" | "sending" | "error";

const VOTE_TIMEOUT_MS = 8_000;

// Stack renders the LAST array entry frontmost, and dragging a card sends it
// to array index 0 (the back) — reversing our ascending scale here means
// dragging the front card away always reveals the next-higher value, so
// browsing the deck goes 0 -> 1 -> 2 -> ... -> ☕.
const STACK_ORDER: CardValue[] = [...CARD_VALUES].reverse();

function CardFace({ value }: { value: CardValue }) {
	return (
		<div className="playing-card text-ink isolate relative flex h-full w-full select-none flex-col items-center justify-center overflow-hidden">
			<div
				aria-hidden
				className="card-watermark pointer-events-none absolute"
				style={{
					inset: "-50%",
					transform: "rotate(-18deg)",
					backgroundImage: `url(${bigtechLogo})`,
					backgroundRepeat: "repeat",
					backgroundSize: "90px auto",
					opacity: 0.4,
				}}
			/>
			<span className="absolute top-2 left-2 flex flex-col items-start gap-1">
				<span className="text-base leading-none font-bold">{value}</span>
				<span className="bg-blue h-2 w-2 rounded-xs" />
			</span>
			<span className="absolute right-2 bottom-2 flex rotate-180 flex-col items-start gap-1">
				<span className="text-base leading-none font-bold">{value}</span>
				<span className="bg-blue h-2 w-2 rounded-xs" />
			</span>
			<span className="border-blue bg-white text-slate-900 relative flex h-20 w-20 items-center justify-center rounded-full border-2 text-3xl font-bold">
				{value}
			</span>
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
				{myVote !== null && (
					<p className="text-muted mt-1 text-sm">
						Tu voto: <strong className="text-ink">{myVote}</strong>
					</p>
				)}
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

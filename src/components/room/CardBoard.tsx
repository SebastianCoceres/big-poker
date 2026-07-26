import { useState } from "react";
import { CARD_VALUES, type CardValue } from "#/lib/fibonacci";
import { castVoteFn } from "#/server/rooms.functions";
import type { RoomSnapshot } from "#/server/rooms.server";

type SendState = "idle" | "sending" | "error";

const VOTE_TIMEOUT_MS = 8_000;

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
	const [selected, setSelected] = useState<CardValue | null>(null);
	const [sendState, setSendState] = useState<SendState>("idle");

	const me = snapshot.participants.find((p) => p.id === participantId);
	const hasVoted = me?.hasVoted ?? false;
	// The snapshot always reveals MY OWN vote to me (never anyone else's
	// pre-reveal), so this survives a refresh mid-round without local state.
	const myVote = me?.vote ?? null;

	async function pick(card: CardValue) {
		setSelected(card);
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

	return (
		<div className="demo-panel rise-in flex flex-col gap-4">
			<div className="flex items-center justify-between gap-2">
				<h2 className="demo-section-title">{snapshot.question}</h2>
				{hasVoted && <span className="demo-pill">Ya votaste</span>}
			</div>
			{sendState === "error" && (
				<p className="demo-alert demo-alert-danger flex items-center gap-2 text-sm">
					No pudimos confirmar tu voto.
					<button
						type="button"
						className="font-semibold underline"
						onClick={() => selected && pick(selected)}
					>
						Reintentar
					</button>
				</p>
			)}
			{/* Edge fade signals there are more cards to scroll to — a flat cut
			    at the container edge gave no hint that `21, 34, 55, 89, ?, ☕`
			    exist past the fold. */}
			<div
				className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2"
				style={{
					maskImage:
						"linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)",
					WebkitMaskImage:
						"linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)",
				}}
			>
				{CARD_VALUES.map((card) => {
					const isSelected = myVote === card;
					return (
						<button
							key={card}
							type="button"
							disabled={sendState === "sending"}
							onClick={() => pick(card)}
							className={`demo-card flex aspect-[3/4] w-20 flex-shrink-0 snap-center items-center justify-center text-xl font-bold transition hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-60 ${
								isSelected ? "border-2 border-[var(--lagoon-deep)]" : ""
							}`}
						>
							{card}
						</button>
					);
				})}
			</div>
		</div>
	);
}

import { IconHandClick } from "@tabler/icons-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { RoomSnapshot } from "#/features/room/domain/entities";
import type { CardValue } from "#/features/voting/domain/entities";
import {
	closeResultFn,
	selectFinalCardFn,
} from "#/features/voting/infrastructure/voting.controllers";
import { AnimatedResultNumber } from "#/features/voting/presentation/ui/AnimatedResultNumber";
import { CardFace } from "#/features/voting/presentation/ui/CardFace";
import { Button } from "#/shared/ui/Button";
import { Kicker } from "#/shared/ui/Kicker";

export function ResultsPanel({
	code,
	participantId,
	snapshot,
}: {
	code: string;
	participantId: string;
	snapshot: RoomSnapshot;
}) {
	const [closing, setClosing] = useState(false);
	// Which card is mid-flight, so a double-tap while the request is still in
	// the air can't fire twice — cleared once the SSE snapshot reflects it (or
	// the request fails).
	const [selecting, setSelecting] = useState<number | null>(null);
	if (!snapshot.results) return null;
	const { average, blocked, voteCount, distinctVotes } = snapshot.results;
	const isMaster = snapshot.masterId === participantId;
	// A single numeric vote means the whole team already agrees — there's
	// nothing to discuss, so skip straight to the result instead of asking
	// the master to "pick" the only option on the table.
	const unanimousCard =
		distinctVotes.length === 1 && typeof distinctVotes[0] === "number"
			? distinctVotes[0]
			: null;
	const finalCard = snapshot.finalCard ?? unanimousCard;
	// Two or more real options on the table with nobody having picked yet —
	// that's the state that's supposed to force a conversation, so closing
	// the round is off the table until it resolves one way or another.
	const hasDispute = finalCard === null && distinctVotes.length > 1;

	async function handleClose() {
		setClosing(true);
		try {
			await closeResultFn({ data: { code, participantId } });
		} finally {
			setClosing(false);
		}
	}

	async function handleSelectFinalCard(card: number) {
		if (selecting !== null) return;
		setSelecting(card);
		try {
			await selectFinalCardFn({
				data: { code, participantId, roundId: snapshot.roundId, card },
			});
		} finally {
			setSelecting(null);
		}
	}

	return (
		<div className="rise-in flex flex-1 flex-col items-center justify-center gap-4 py-8 text-center">
			<Kicker>Resultado</Kicker>
			<h2 className="text-muted max-w-lg text-base font-semibold">
				{snapshot.question}
			</h2>

			{finalCard !== null ? (
				// Once the team has agreed on a number, that's the only thing worth
				// showing — the disputed cards and the suggestion were only ever
				// scaffolding for the discussion that got them here.
				<div
					className="rise-in flex flex-col items-center gap-2"
					style={{ animationDelay: "80ms" }}
				>
					<p className="text-ink text-sm font-semibold">Resultado final</p>
					<div className="h-72 w-50">
						<CardFace value={finalCard as CardValue} />
					</div>
				</div>
			) : (
				<>
					{distinctVotes.length > 0 && (
						<div
							className="rise-in flex flex-col items-center gap-2"
							style={{ animationDelay: "80ms" }}
						>
							<p className="text-muted text-sm">Cartas en disputa</p>
							<div className="flex flex-wrap items-center justify-center gap-3">
								{distinctVotes.map((value) => {
									const isNumeric = typeof value === "number";
									// Only the master can pick, and only a numeric card is ever
									// a valid final result — "?"/"☕" mean "can't estimate yet".
									const canPick = isMaster && isNumeric && selecting === null;
									// Safe: every value here came from a participant's vote,
									// only ever set through CastVoteUseCase's isCardValue check.
									const card = <CardFace value={value as CardValue} />;
									return (
										<div
											key={value}
											className={cn(
												"h-52 w-36 shrink-0",
												!isNumeric && "opacity-50",
											)}
										>
											{canPick ? (
												<button
													type="button"
													className="focus-visible:outline-blue h-full w-full cursor-pointer rounded-2xl focus-visible:outline-2"
													onClick={() => handleSelectFinalCard(value as number)}
												>
													{card}
												</button>
											) : (
												card
											)}
										</div>
									);
								})}
							</div>
							{isMaster && hasDispute && (
								<p className="text-muted flex items-center gap-1.5 text-xs">
									<IconHandClick className="size-4 shrink-0" aria-hidden />
									Toquen la carta en la que se pongan de acuerdo.
								</p>
							)}
						</div>
					)}

					{blocked ? (
						<p
							className="text-warning rise-in text-sm"
							style={{ animationDelay: "120ms" }}
						>
							Hay votos de discusión. Charlá
							con el equipo y volvé a votar. 
						</p>
					) : average !== null ? (
						<div
							className="rise-in flex flex-col items-center gap-1"
							style={{ animationDelay: "120ms" }}
						>
							<Kicker className="text-muted">Sugerencia (promedio)</Kicker>
							<AnimatedResultNumber
								value={average}
								roundId={snapshot.roundId}
								className="text-3xl sm:text-4xl"
							/>
							<span className="text-muted text-sm">
								{voteCount} voto{voteCount === 1 ? "" : "s"}
							</span>
						</div>
					) : (
						<p className="text-muted text-sm">
							Nadie votó todavía en esta ronda.
						</p>
					)}
				</>
			)}

			{isMaster && !hasDispute && (
				<Button
					variant="secondary"
					className="mt-2"
					onClick={handleClose}
					disabled={closing}
				>
					Cerrar resultado
				</Button>
			)}
		</div>
	);
}

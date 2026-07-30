import { useState } from "react";
import type { RoomSnapshot } from "#/features/room/domain/entities";
import { closeResultFn } from "#/features/voting/infrastructure/voting.controllers";
import { AnimatedResultNumber } from "#/features/voting/presentation/ui/AnimatedResultNumber";
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
	if (!snapshot.results) return null;
	const { average, blocked, voteCount } = snapshot.results;
	const isMaster = snapshot.masterId === participantId;

	async function handleClose() {
		setClosing(true);
		try {
			await closeResultFn({ data: { code, participantId } });
		} finally {
			setClosing(false);
		}
	}

	return (
		<div className="rise-in flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
			<Kicker>Resultado</Kicker>
			<h2 className="text-muted max-w-lg text-base font-semibold">
				{snapshot.question}
			</h2>
			{blocked ? (
				<p
					className="text-warning rise-in text-sm"
					style={{ animationDelay: "120ms" }}
				>
					Hay votos de discusión (?/☕) — no se calcula un promedio. Charlá con
					el equipo y volvé a votar. Mirá la carta de cada uno en su avatar,
					abajo.
				</p>
			) : average !== null ? (
				<div
					className="rise-in flex flex-col items-center gap-1"
					style={{ animationDelay: "120ms" }}
				>
					<AnimatedResultNumber value={average} roundId={snapshot.roundId} />
					<span className="text-muted text-sm">
						{voteCount} voto{voteCount === 1 ? "" : "s"}
					</span>
				</div>
			) : (
				<p className="text-muted text-sm">Nadie votó todavía en esta ronda.</p>
			)}
			{isMaster && (
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

import type { RoomSnapshot } from "#/server/rooms.server";

export function ResultsPanel({ snapshot }: { snapshot: RoomSnapshot }) {
	if (!snapshot.results) return null;
	const { average, blocked, voteCount } = snapshot.results;

	return (
		<div className="demo-panel rise-in flex flex-col gap-3">
			<h2 className="demo-section-title">{snapshot.question}</h2>
			{blocked ? (
				<p className="demo-alert text-sm">
					Hay votos de discusión (?/☕) — no se calcula un promedio. Charlá con
					el equipo y volvé a votar. Mirá las cartas de cada uno abajo, en su
					avatar.
				</p>
			) : average !== null ? (
				<p className="demo-alert text-sm">
					Media estimada: <strong>{average}</strong> (redondeada hacia arriba,{" "}
					{voteCount} voto{voteCount === 1 ? "" : "s"}).
				</p>
			) : (
				<p className="demo-muted text-sm">Nadie votó todavía en esta ronda.</p>
			)}
		</div>
	);
}

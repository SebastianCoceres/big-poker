import { type FormEvent, useState } from "react";
import { revealFn, startRoundFn } from "#/server/rooms.functions";
import type { RoomSnapshot } from "#/server/rooms.server";

export function QuestionPanel({
	code,
	participantId,
	snapshot,
}: {
	code: string;
	participantId: string;
	snapshot: RoomSnapshot;
}) {
	const [question, setQuestion] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const isVoting = snapshot.status === "voting";

	async function handleStart(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		setSubmitting(true);
		try {
			const result = await startRoundFn({
				data: { code, participantId, question },
			});
			if (!result.ok) {
				setError(
					"No pudimos iniciar la ronda. Revisá la pregunta e intentá de nuevo.",
				);
				return;
			}
			setQuestion("");
		} finally {
			setSubmitting(false);
		}
	}

	async function handleReveal() {
		setSubmitting(true);
		try {
			await revealFn({ data: { code, participantId } });
		} finally {
			setSubmitting(false);
		}
	}

	if (isVoting) {
		const votedCount = snapshot.participants.filter((p) => p.hasVoted).length;
		return (
			<div className="demo-panel rise-in flex flex-col gap-3">
				<p className="island-kicker">Ronda en curso</p>
				<p className="demo-muted text-sm">
					{votedCount} de {snapshot.participants.length} ya votaron.
				</p>
				<button
					type="button"
					className="demo-button"
					onClick={handleReveal}
					disabled={submitting}
				>
					Revelar votos
				</button>
			</div>
		);
	}

	return (
		<form
			onSubmit={handleStart}
			className="demo-panel rise-in flex flex-col gap-3"
		>
			<p className="island-kicker">
				{snapshot.question ? "Nueva pregunta" : "Primera pregunta"}
			</p>
			<label className="flex flex-col gap-1 text-sm font-semibold">
				Historia / pregunta a votar
				<textarea
					className="demo-textarea"
					value={question}
					onChange={(e) => setQuestion(e.target.value)}
					maxLength={300}
					required
					placeholder="Ej: ¿Cuánto esfuerzo lleva la historia X?"
				/>
			</label>
			{error && <p className="demo-alert demo-alert-danger text-sm">{error}</p>}
			<button type="submit" className="demo-button" disabled={submitting}>
				{snapshot.question ? "Iniciar nueva ronda" : "Iniciar ronda"}
			</button>
		</form>
	);
}

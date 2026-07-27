import { type FormEvent, useState } from "react";
import { startRoundFn } from "#/server/rooms.functions";
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

	return (
		<form onSubmit={handleStart} className="panel rise-in flex flex-col gap-3">
			<p className="kicker">
				{snapshot.question ? "Nueva pregunta" : "Primera pregunta"}
			</p>
			<label className="flex flex-col gap-1 text-sm font-semibold">
				Historia / pregunta a votar
				<textarea
					className="field min-h-28 resize-y"
					value={question}
					onChange={(e) => setQuestion(e.target.value)}
					maxLength={300}
					required
					placeholder="Ej: ¿Cuánto esfuerzo lleva la historia X?"
				/>
			</label>
			{error && <p className="alert alert-danger text-sm">{error}</p>}
			<button type="submit" className="btn" disabled={submitting}>
				{snapshot.question ? "Iniciar nueva ronda" : "Iniciar ronda"}
			</button>
		</form>
	);
}

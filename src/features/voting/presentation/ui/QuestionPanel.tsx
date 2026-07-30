import { type FormEvent, useState } from "react";
import type { RoomSnapshot } from "#/features/room/domain/entities";
import { startRoundFn } from "#/features/voting/infrastructure/voting.controllers";
import { Button } from "#/shared/ui/Button";
import { TextField } from "#/shared/ui/Field";
import { Kicker } from "#/shared/ui/Kicker";

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
		<form
			onSubmit={handleStart}
			className="rise-in flex flex-1 flex-col justify-center gap-3"
		>
			<Kicker>
				{snapshot.question ? "Nueva pregunta" : "Primera pregunta"}
			</Kicker>
			{/* biome-ignore lint/a11y/noLabelWithoutControl: TextField renders a real <textarea> nested right here — Biome just can't see through the wrapper component. */}
			<label className="flex flex-col gap-1 text-sm font-semibold">
				Historia / pregunta a votar
				<TextField
					className="min-h-28 resize-y"
					value={question}
					onChange={(e) => setQuestion(e.target.value)}
					maxLength={300}
					required
					placeholder="Ej: ¿Cuánto esfuerzo lleva la historia X?"
				/>
			</label>
			{error && <p className="text-danger text-sm">{error}</p>}
			<Button type="submit" disabled={submitting}>
				{snapshot.question ? "Iniciar nueva ronda" : "Iniciar ronda"}
			</Button>
		</form>
	);
}

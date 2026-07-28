import { type FormEvent, useState } from "react";
import type { ParticipantIdentity } from "#/hooks/useParticipantIdentity";
import { joinRoomFn } from "#/server/rooms.functions";
import type { RoomErrorCode } from "#/server/rooms.server";

function errorMessage(error: RoomErrorCode): string {
	switch (error) {
		case "INVALID_NAME":
			return "Escribí un nombre válido (1 a 30 caracteres).";
		case "NAME_TAKEN":
			return "Ya hay alguien en la sala con ese nombre. Probá agregar tu inicial o apellido.";
		case "ROOM_NOT_FOUND":
			return "Esta sala no existe o ya no está disponible.";
		default:
			return "Ocurrió un error inesperado. Probá de nuevo.";
	}
}

export function JoinForm({
	code,
	onJoined,
}: {
	code: string;
	onJoined: (identity: ParticipantIdentity) => void;
}) {
	const [name, setName] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		setSubmitting(true);
		try {
			const result = await joinRoomFn({ data: { code, name } });
			if (!result.ok) {
				setError(errorMessage(result.error));
				return;
			}
			onJoined({ participantId: result.data.participantId, name: name.trim() });
		} catch (err) {
			console.error("[joinRoomFn] request failed", err);
			setError("No pudimos unirte a la sala. Probá de nuevo.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="rise-in mx-auto flex w-full max-w-md flex-col gap-4"
		>
			<div>
				<p className="kicker mb-1">Sala {code}</p>
				<h1 className="heading-lg text-2xl">Unirte a la sala</h1>
			</div>
			<label className="flex flex-col gap-1 text-sm font-semibold">
				Tu nombre
				<input
					className="field"
					value={name}
					onChange={(e) => setName(e.target.value)}
					maxLength={30}
					required
					placeholder="Ej: Fede"
				/>
			</label>
			{error && <p className="text-danger text-sm">{error}</p>}
			<button type="submit" className="btn" disabled={submitting}>
				{submitting ? "Uniéndote..." : "Unirse"}
			</button>
		</form>
	);
}

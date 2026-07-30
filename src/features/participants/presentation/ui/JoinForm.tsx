import { type FormEvent, useEffect, useState } from "react";
import { joinRoomFn } from "#/features/participants/infrastructure/participant.controllers";
import {
	type ParticipantIdentity,
	readDisplayName,
	writeDisplayName,
} from "#/features/participants/presentation/hooks/useParticipantIdentity";
import type { RoomErrorCode } from "#/features/room/domain/errors";
import { Button } from "#/shared/ui/Button";
import { Field } from "#/shared/ui/Field";
import { Kicker } from "#/shared/ui/Kicker";

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
	// This browser already knows who it is (saved from a previous visit,
	// here or on Home) — one identity per browser, so join straight away
	// instead of asking again. Only a browser that's never been here before
	// (or incognito) needs the form below.
	const knownName = readDisplayName();
	const [name, setName] = useState(knownName ?? "");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function join(joinName: string) {
		setError(null);
		setSubmitting(true);
		try {
			const result = await joinRoomFn({ data: { code, name: joinName } });
			if (!result.ok) {
				setError(errorMessage(result.error));
				return;
			}
			const trimmed = joinName.trim();
			writeDisplayName(trimmed);
			onJoined({ participantId: result.data.participantId, name: trimmed });
		} catch (err) {
			console.error("[joinRoomFn] request failed", err);
			setError("No pudimos unirte a la sala. Probá de nuevo.");
		} finally {
			setSubmitting(false);
		}
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount only, to auto-join with the browser's already-known name.
	useEffect(() => {
		if (knownName) join(knownName);
	}, []);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		join(name);
	}

	// While the known name is auto-joining and hasn't failed, there's
	// nothing to show but a loading state — no form, no name to re-enter.
	if (knownName && !error) {
		return <p className="text-muted rise-in text-sm">Uniéndote a la sala...</p>;
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="rise-in mx-auto flex w-full max-w-md flex-col gap-4"
		>
			<div>
				<Kicker className="mb-1">Sala {code}</Kicker>
				<h1 className="heading-lg text-2xl">Unirte a la sala</h1>
			</div>
			{/* biome-ignore lint/a11y/noLabelWithoutControl: Field renders a real <input> nested right here — Biome just can't see through the wrapper component. */}
			<label className="flex flex-col gap-1 text-sm font-semibold">
				Tu nombre
				<Field
					value={name}
					onChange={(e) => setName(e.target.value)}
					maxLength={30}
					required
					placeholder="Ej: Fede"
				/>
			</label>
			{error && <p className="text-danger text-sm">{error}</p>}
			<Button type="submit" disabled={submitting}>
				{submitting ? "Uniéndote..." : "Unirse"}
			</Button>
		</form>
	);
}

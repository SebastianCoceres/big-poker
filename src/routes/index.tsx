import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useEffect, useState } from "react";
import {
	readDisplayName,
	writeDisplayName,
	writeParticipantIdentity,
} from "#/hooks/useParticipantIdentity";
import { normalizeRoomCode } from "#/lib/room-code";
import { createRoomFn, joinRoomFn } from "#/server/rooms.functions";
import type { RoomErrorCode } from "#/server/rooms.server";

export const Route = createFileRoute("/")({ component: Home });

function errorMessage(error: RoomErrorCode): string {
	switch (error) {
		case "INVALID_NAME":
			return "Escribí un nombre válido (1 a 30 caracteres).";
		case "NAME_TAKEN":
			return "Ya hay alguien en la sala con ese nombre. Probá agregar tu inicial o apellido.";
		case "ROOM_NOT_FOUND":
			return "No encontramos una sala con ese código. Revisá que esté bien escrito.";
		case "ROOM_CODE_EXHAUSTED":
			return "No pudimos generar un código de sala. Probá de nuevo.";
		default:
			return "Ocurrió un error inesperado. Probá de nuevo.";
	}
}

type Step = "name" | "choose" | "join";

function Home() {
	const navigate = useNavigate();

	// Starts on "name" so SSR (no localStorage) and the client's first paint
	// match; the effect below jumps straight to "choose" for a returning
	// visitor who already has a saved display name.
	const [hydrated, setHydrated] = useState(false);
	const [step, setStep] = useState<Step>("name");
	const [displayName, setDisplayNameState] = useState("");
	const [nameInput, setNameInput] = useState("");

	useEffect(() => {
		const saved = readDisplayName();
		if (saved) {
			setDisplayNameState(saved);
			setStep("choose");
		}
		setHydrated(true);
	}, []);

	const [creating, setCreating] = useState(false);
	const [createError, setCreateError] = useState<string | null>(null);

	const [joinCode, setJoinCode] = useState("");
	const [joining, setJoining] = useState(false);
	const [joinError, setJoinError] = useState<string | null>(null);

	function handleConfirmName(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const trimmed = nameInput.trim();
		if (!trimmed) return;
		writeDisplayName(trimmed);
		setDisplayNameState(trimmed);
		setStep("choose");
	}

	function handleChangeName() {
		setNameInput(displayName);
		setStep("name");
	}

	async function handleCreate() {
		setCreateError(null);
		setCreating(true);
		try {
			const result = await createRoomFn({ data: { name: displayName } });
			if (!result.ok) {
				setCreateError(errorMessage(result.error));
				return;
			}
			writeParticipantIdentity(result.data.snapshot.code, {
				participantId: result.data.participantId,
				name: displayName,
			});
			navigate({
				to: "/room/$roomCode",
				params: { roomCode: result.data.snapshot.code },
			});
		} catch (err) {
			console.error("[createRoomFn] request failed", err);
			setCreateError("No pudimos crear la sala. Probá de nuevo.");
		} finally {
			setCreating(false);
		}
	}

	async function handleJoin(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setJoinError(null);
		setJoining(true);
		const code = normalizeRoomCode(joinCode);
		try {
			const result = await joinRoomFn({
				data: { code, name: displayName },
			});
			if (!result.ok) {
				setJoinError(errorMessage(result.error));
				return;
			}
			writeParticipantIdentity(code, {
				participantId: result.data.participantId,
				name: displayName,
			});
			navigate({ to: "/room/$roomCode", params: { roomCode: code } });
		} catch (err) {
			console.error("[joinRoomFn] request failed", err);
			setJoinError("No pudimos unirte a la sala. Probá de nuevo.");
		} finally {
			setJoining(false);
		}
	}

	// Avoids flashing the name step for a returning visitor before the
	// localStorage read above resolves.
	if (!hydrated) return null;

	return (
		<main className="page-wrap flex min-h-[calc(100vh-9rem)] flex-col items-center justify-center gap-6 px-4 py-14">
			<div className="home-aurora" aria-hidden />
			<div className="rise-in max-w-md text-center">
				<p className="kicker mb-2">BigPoker</p>
				<h1 className="heading-lg text-3xl sm:text-4xl">
					Estimá en equipo, sin fricción.
				</h1>
				{step === "name" && (
					<p className="text-muted mt-2 text-sm">
						Sin cuentas, sin instalaciones. Empecemos con tu nombre.
					</p>
				)}
			</div>

			{step === "name" && (
				<form
					onSubmit={handleConfirmName}
					className="panel rise-in flex w-full max-w-md flex-col gap-4"
				>
					<label className="flex flex-col gap-1 text-sm font-semibold">
						Tu nombre
						<input
							className="field"
							value={nameInput}
							onChange={(e) => setNameInput(e.target.value)}
							maxLength={30}
							required
							placeholder="Ej: Sebastián"
						/>
					</label>
					<button type="submit" className="btn">
						Continuar
					</button>
				</form>
			)}

			{step === "choose" && (
				<div className="panel rise-in flex w-full max-w-md flex-col gap-4">
					<p className="text-muted text-sm">
						Hola, <strong className="text-ink">{displayName}</strong>.
					</p>
					{createError && (
						<p className="alert alert-danger text-sm">{createError}</p>
					)}
					<button
						type="button"
						onClick={handleCreate}
						className="btn"
						disabled={creating}
					>
						{creating ? "Creando..." : "Crear sala"}
					</button>
					<button
						type="button"
						onClick={() => setStep("join")}
						className="btn btn-secondary"
					>
						Unirse a sala
					</button>
					<button
						type="button"
						onClick={handleChangeName}
						className="text-blue-deep text-sm font-semibold underline decoration-blue/40 underline-offset-4 transition hover:brightness-90"
					>
						¿No sos vos? Cambiar nombre
					</button>
				</div>
			)}

			{step === "join" && (
				<form
					onSubmit={handleJoin}
					className="panel rise-in flex w-full max-w-md flex-col gap-4"
				>
					<div>
						<h2 className="heading-sm mb-1">Unirse a sala</h2>
						<p className="text-muted text-sm">
							Pedile el código al master de la sala.
						</p>
					</div>
					<label className="flex flex-col gap-1 text-sm font-semibold">
						Código de sala
						<input
							className="field uppercase tracking-[0.2em]"
							value={joinCode}
							onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
							maxLength={6}
							required
							placeholder="Ej: 7F3KQD"
						/>
					</label>
					{joinError && (
						<p className="alert alert-danger text-sm">{joinError}</p>
					)}
					<button
						type="submit"
						className="btn btn-secondary"
						disabled={joining}
					>
						{joining ? "Uniéndote..." : "Unirse a sala"}
					</button>
					<button
						type="button"
						onClick={() => setStep("choose")}
						className="text-ink-soft text-sm font-semibold underline underline-offset-4"
					>
						Volver
					</button>
				</form>
			)}
		</main>
	);
}

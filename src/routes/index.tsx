import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { writeParticipantIdentity } from "#/hooks/useParticipantIdentity";
import { normalizeRoomCode } from "#/lib/room-code";
import { createRoomFn, joinRoomFn } from "#/server/rooms.functions";
import type { RoomErrorCode } from "#/server/rooms.server";

export const Route = createFileRoute("/")({ component: Home });

function errorMessage(error: RoomErrorCode): string {
	switch (error) {
		case "INVALID_NAME":
			return "Escribí un nombre válido (1 a 30 caracteres).";
		case "ROOM_NOT_FOUND":
			return "No encontramos una sala con ese código. Revisá que esté bien escrito.";
		case "ROOM_CODE_EXHAUSTED":
			return "No pudimos generar un código de sala. Probá de nuevo.";
		default:
			return "Ocurrió un error inesperado. Probá de nuevo.";
	}
}

function Home() {
	const navigate = useNavigate();

	const [createName, setCreateName] = useState("");
	const [creating, setCreating] = useState(false);
	const [createError, setCreateError] = useState<string | null>(null);

	const [joinCode, setJoinCode] = useState("");
	const [joinName, setJoinName] = useState("");
	const [joining, setJoining] = useState(false);
	const [joinError, setJoinError] = useState<string | null>(null);

	async function handleCreate(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setCreateError(null);
		setCreating(true);
		try {
			const participantId = crypto.randomUUID();
			const result = await createRoomFn({
				data: { participantId, name: createName },
			});
			if (!result.ok) {
				setCreateError(errorMessage(result.error));
				return;
			}
			writeParticipantIdentity(result.data.code, {
				participantId,
				name: createName.trim(),
			});
			navigate({
				to: "/room/$roomCode",
				params: { roomCode: result.data.code },
			});
		} catch {
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
			const participantId = crypto.randomUUID();
			const result = await joinRoomFn({
				data: { code, participantId, name: joinName },
			});
			if (!result.ok) {
				setJoinError(errorMessage(result.error));
				return;
			}
			writeParticipantIdentity(code, {
				participantId,
				name: joinName.trim(),
			});
			navigate({ to: "/room/$roomCode", params: { roomCode: code } });
		} catch {
			setJoinError("No pudimos unirte a la sala. Probá de nuevo.");
		} finally {
			setJoining(false);
		}
	}

	return (
		<main className="page-wrap px-4 pb-8 pt-14">
			<section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
				<div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
				<div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />
				<p className="island-kicker mb-3">Planning Poker</p>
				<h1 className="display-title mb-5 max-w-3xl text-4xl leading-[1.02] font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl">
					Estimá en equipo, sin fricción.
				</h1>
				<p className="mb-8 max-w-2xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
					Creá una sala o unite con un código. Pensado para reuniones
					presenciales: todo pasa en tiempo real, sin cuentas ni instalaciones.
				</p>
			</section>

			<section className="mt-8 grid gap-6 sm:grid-cols-2">
				<form
					onSubmit={handleCreate}
					className="demo-panel rise-in flex flex-col gap-4"
				>
					<div>
						<h2 className="demo-section-title mb-1">Crear sala</h2>
						<p className="demo-muted text-sm">
							Vas a ser el master: escribís las preguntas y controlás la ronda.
						</p>
					</div>
					<label className="flex flex-col gap-1 text-sm font-semibold">
						Tu nombre
						<input
							className="demo-input"
							value={createName}
							onChange={(e) => setCreateName(e.target.value)}
							maxLength={30}
							required
							placeholder="Ej: Sebastián"
						/>
					</label>
					{createError && (
						<p className="demo-alert demo-alert-danger text-sm">
							{createError}
						</p>
					)}
					<button type="submit" className="demo-button" disabled={creating}>
						{creating ? "Creando..." : "Crear sala"}
					</button>
				</form>

				<form
					onSubmit={handleJoin}
					className="demo-panel rise-in flex flex-col gap-4"
					style={{ animationDelay: "80ms" }}
				>
					<div>
						<h2 className="demo-section-title mb-1">Unirse a sala</h2>
						<p className="demo-muted text-sm">
							Pedile el código al master de la sala.
						</p>
					</div>
					<label className="flex flex-col gap-1 text-sm font-semibold">
						Código de sala
						<input
							className="demo-input uppercase tracking-[0.2em]"
							value={joinCode}
							onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
							maxLength={6}
							required
							placeholder="Ej: 7F3KQD"
						/>
					</label>
					<label className="flex flex-col gap-1 text-sm font-semibold">
						Tu nombre
						<input
							className="demo-input"
							value={joinName}
							onChange={(e) => setJoinName(e.target.value)}
							maxLength={30}
							required
							placeholder="Ej: Fede"
						/>
					</label>
					{joinError && (
						<p className="demo-alert demo-alert-danger text-sm">{joinError}</p>
					)}
					<button
						type="submit"
						className="demo-button demo-button-secondary"
						disabled={joining}
					>
						{joining ? "Uniéndote..." : "Unirse a sala"}
					</button>
				</form>
			</section>
		</main>
	);
}

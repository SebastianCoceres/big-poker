import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ConfirmButton } from "#/components/room/ConfirmButton";
import type { RoomSnapshot } from "#/features/room/domain/entities";
import {
	closeRoomFn,
	kickParticipantFn,
} from "#/features/room/interface-adapters/room.controllers";
import { ISLAND_SPRING } from "#/lib/motion";

const COPIED_RESET_MS = 2000;

/**
 * Master-only control surface for the room, shaped as the same "Dynamic
 * Island" pill ParticipantBar uses at the bottom, but sitting in normal
 * document flow at the top of RoomBody (not fixed — it doesn't need to
 * survive scrolling the way the always-relevant participant roster does).
 * Expands into copy-code / close-room / manage-participants controls.
 */
export function RoomControlIsland({
	code,
	participantId,
	snapshot,
}: {
	code: string;
	participantId: string;
	snapshot: RoomSnapshot;
}) {
	const [expanded, setExpanded] = useState(false);
	const [copied, setCopied] = useState(false);

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			setTimeout(() => setCopied(false), COPIED_RESET_MS);
		} catch {
			// Clipboard API unavailable or permission denied — nothing more we
			// can do; the code is still shown on screen to copy by hand.
		}
	}

	function handleClose() {
		closeRoomFn({ data: { code, participantId } });
	}

	function handleKick(targetId: string) {
		kickParticipantFn({ data: { code, participantId, targetId } });
	}

	const others = snapshot.participants.filter((p) => p.id !== participantId);

	return (
		<div className="rise-in flex justify-start">
			<motion.div
				layout
				transition={ISLAND_SPRING}
				className="border-line bg-header shadow-ink/20 flex w-fit max-w-full flex-col overflow-hidden rounded-[1.75rem] border shadow-2xl backdrop-blur-xl"
			>
				<button
					type="button"
					onClick={() => setExpanded((v) => !v)}
					aria-expanded={expanded}
					aria-label={
						expanded ? "Ocultar controles de sala" : "Ver controles de sala"
					}
					className="flex items-center gap-3 px-4 py-2.5"
				>
					<span className="text-left">
						<span className="kicker block">Código de sala</span>
						<span className="text-ink text-lg font-bold tracking-[0.2em]">
							{code}
						</span>
					</span>
				</button>

				<AnimatePresence initial={false}>
					{expanded && (
						<motion.div
							key="controls"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={ISLAND_SPRING}
							className="flex max-h-80 flex-col gap-4 overflow-y-auto px-4 pb-4"
						>
							<div className="flex flex-wrap gap-2">
								<button
									type="button"
									onClick={handleCopy}
									className="btn btn-secondary"
								>
									{copied ? "¡Copiado!" : "Copiar código"}
								</button>
								<ConfirmButton
									label="Cerrar sala"
									confirmLabel="¿Seguro? Sí, cerrar"
									onConfirm={handleClose}
									className="btn btn-danger"
								/>
							</div>

							{others.length > 0 && (
								<div>
									<p className="kicker mb-2">Participantes</p>
									<ul className="flex flex-col gap-2">
										{others.map((p) => (
											<li
												key={p.id}
												className="flex items-center justify-between gap-3 text-sm"
											>
												<span className={p.connected ? "" : "opacity-40"}>
													{p.name}
												</span>
												<ConfirmButton
													label="Eliminar"
													confirmLabel="¿Seguro?"
													onConfirm={() => handleKick(p.id)}
													className="btn btn-danger px-3 py-1.5 text-xs"
												/>
											</li>
										))}
									</ul>
								</div>
							)}
						</motion.div>
					)}
				</AnimatePresence>
			</motion.div>
		</div>
	);
}

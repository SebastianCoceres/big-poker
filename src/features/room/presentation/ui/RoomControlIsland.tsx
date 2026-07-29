import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ParticipantManagementList } from "#/features/participants/presentation/ui/ParticipantManagementList";
import type { RoomSnapshot } from "#/features/room/domain/entities";
import { CloseRoomButton } from "#/features/room/presentation/ui/CloseRoomButton";
import { CopyRoomCodeButton } from "#/features/room/presentation/ui/CopyRoomCodeButton";
import { ISLAND_SPRING } from "#/shared/lib/motion";

/**
 * Master-only control surface for the room, shaped as the same "Dynamic
 * Island" pill ParticipantBar uses at the bottom, but sitting in normal
 * document flow at the top of RoomBody (not fixed — it doesn't need to
 * survive scrolling the way the always-relevant participant roster does).
 * Expands into copy-code / close-room / manage-participants controls — each
 * its own single-responsibility component, composed here.
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
								<CopyRoomCodeButton code={code} />
								<CloseRoomButton code={code} participantId={participantId} />
							</div>

							<ParticipantManagementList
								code={code}
								participantId={participantId}
								others={others}
							/>
						</motion.div>
					)}
				</AnimatePresence>
			</motion.div>
		</div>
	);
}

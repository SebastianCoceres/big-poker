import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { RoomSnapshot } from "#/features/room/domain/entities";
import { ISLAND_SPRING } from "#/shared/lib/motion";

const AVATAR_COLORS = [
	"#2563eb",
	"#7c3aed",
	"#0ea5e9",
	"#db2777",
	"#f59e0b",
	"#059669",
	"#e11d48",
	"#0891b2",
];

// Beyond this many, the rest collapse into a "+N" chip (see VISIBLE_LIMIT
// below) — a horizontal bar of 15 avatars stops being scannable.
const VISIBLE_LIMIT = 5;

function colorForId(id: string): string {
	let hash = 0;
	for (let i = 0; i < id.length; i++) {
		hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
	}
	return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function initials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "?";
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[1][0]).toUpperCase();
}

type Participant = RoomSnapshot["participants"][number];

function Avatar({
	participant,
	status,
}: {
	participant: Participant;
	status: RoomSnapshot["status"];
}) {
	const showCheck = status === "voting" && participant.hasVoted;
	const showVote = status === "revealed";

	return (
		<motion.li
			layout
			initial={{ opacity: 0, scale: 0.4, y: 12 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.4, y: 12 }}
			transition={ISLAND_SPRING}
			className="flex shrink-0 flex-col items-center gap-1"
			title={participant.name}
		>
			{/* Opacity dims only this inner circle — the badge below is a
			    sibling so a disconnected participant's revealed vote never
			    becomes illegible. */}
			<div className="relative h-12 w-12">
				<div
					className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white transition-opacity duration-300 ${
						participant.connected ? "" : "opacity-40"
					} ${
						participant.isMaster
							? "ring-blue-deep ring-offset-header ring-2 ring-offset-2"
							: ""
					}`}
					style={{ backgroundColor: colorForId(participant.id) }}
				>
					{initials(participant.name)}
				</div>
				{showCheck && (
					<span className="ring-header absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[11px] leading-none text-white ring-2">
						✓
					</span>
				)}
				{showVote && (
					<span className="ring-header absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-700 px-1 text-[10px] font-bold leading-none text-white ring-2">
						{participant.vote ?? "–"}
					</span>
				)}
			</div>
		</motion.li>
	);
}

export function ParticipantBar({ snapshot }: { snapshot: RoomSnapshot }) {
	const [expanded, setExpanded] = useState(false);
	const visible = snapshot.participants.slice(0, VISIBLE_LIMIT);
	const overflow = snapshot.participants.slice(VISIBLE_LIMIT);

	return (
		<nav
			aria-label="Participantes conectados"
			className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))] z-40 flex justify-center px-4"
		>
			{/* A fixed, generous corner radius (not rounded-full) is what makes this
			    read as Apple's Dynamic Island rather than a stretched pill: short
			    and it looks like a capsule, tall (overflow open) and it still looks
			    like one continuous shape instead of ballooning into a circle. */}
			<motion.div
				layout
				transition={ISLAND_SPRING}
				className="border-line bg-header shadow-ink/20 pointer-events-auto flex w-fit max-w-full flex-col rounded-full border shadow-2xl backdrop-blur-xl"
			>
				<AnimatePresence initial={false}>
					{expanded && overflow.length > 0 && (
						<motion.div
							key="overflow"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={ISLAND_SPRING}
							className="max-h-64 overflow-y-auto px-4 pt-3"
						>
							<p className="kicker mb-2">Más participantes</p>
							<ul className="flex flex-col gap-2 pb-1">
								{overflow.map((p) => (
									<li
										key={p.id}
										className="flex items-center justify-between gap-2 text-sm"
									>
										<span className={p.connected ? "" : "opacity-40"}>
											{p.name}
											{p.isMaster ? " · master" : ""}
										</span>
										{snapshot.status === "voting" &&
											(p.hasVoted ? (
												<span className="pill">✓</span>
											) : (
												<span className="text-muted text-xs">esperando</span>
											))}
										{snapshot.status === "revealed" && (
											<span className="pill">{p.vote ?? "–"}</span>
										)}
									</li>
								))}
							</ul>
						</motion.div>
					)}
				</AnimatePresence>

				<motion.ul
					layout
					className="flex list-none items-start gap-3 overflow-x-auto p-2"
				>
					<AnimatePresence initial={false}>
						{visible.map((p) => (
							<Avatar key={p.id} participant={p} status={snapshot.status} />
						))}
					</AnimatePresence>
					{overflow.length > 0 && (
						<motion.li
							layout
							className="flex shrink-0 flex-col items-center gap-1"
						>
							<button
								type="button"
								onClick={() => setExpanded((v) => !v)}
								aria-expanded={expanded}
								aria-label={`Ver ${overflow.length} participantes más`}
								className="border-chip-line bg-chip text-ink focus-visible:ring-blue-deep flex h-12 w-12 items-center justify-center rounded-full border text-sm font-bold transition hover:-translate-y-0.5 active:scale-95 focus-visible:outline-none focus-visible:ring-2"
							>
								+{overflow.length}
							</button>
							<span className="text-ink-soft text-[10px]">más</span>
						</motion.li>
					)}
				</motion.ul>
			</motion.div>
		</nav>
	);
}

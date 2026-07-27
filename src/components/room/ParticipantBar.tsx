import { useState } from "react";
import type { RoomSnapshot } from "#/server/rooms.server";

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
		<li
			className="flex flex-shrink-0 flex-col items-center gap-1"
			title={participant.name}
		>
			{/* Opacity dims only this inner circle — the badge below is a
			    sibling so a disconnected participant's revealed vote never
			    becomes illegible. */}
			<div className="relative h-12 w-12">
				<div
					className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white transition ${
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
			<span className="text-ink-soft max-w-12 truncate text-[10px]">
				{participant.name}
			</span>
		</li>
	);
}

export function ParticipantBar({ snapshot }: { snapshot: RoomSnapshot }) {
	const [expanded, setExpanded] = useState(false);
	const visible = snapshot.participants.slice(0, VISIBLE_LIMIT);
	const overflow = snapshot.participants.slice(VISIBLE_LIMIT);

	return (
		<nav className="border-line bg-header fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-lg">
			{expanded && overflow.length > 0 && (
				<div className="border-line bg-header shadow-ink/10 absolute inset-x-4 bottom-full mb-2 max-h-64 overflow-y-auto rounded-2xl border p-3 shadow-xl backdrop-blur-lg">
					<p className="kicker mb-2">Más participantes</p>
					<ul className="flex flex-col gap-2">
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
				</div>
			)}
			<ul className="mx-auto flex max-w-3xl list-none items-start gap-3 overflow-x-auto px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
				{visible.map((p) => (
					<Avatar key={p.id} participant={p} status={snapshot.status} />
				))}
				{overflow.length > 0 && (
					<li className="flex flex-shrink-0 flex-col items-center gap-1">
						<button
							type="button"
							onClick={() => setExpanded((v) => !v)}
							aria-expanded={expanded}
							aria-label={`Ver ${overflow.length} participantes más`}
							className="border-chip-line bg-chip text-ink flex h-12 w-12 items-center justify-center rounded-full border text-sm font-bold transition hover:-translate-y-0.5"
						>
							+{overflow.length}
						</button>
						<span className="text-ink-soft text-[10px]">más</span>
					</li>
				)}
			</ul>
		</nav>
	);
}

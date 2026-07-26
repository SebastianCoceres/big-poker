import { useState } from "react";
import type { RoomSnapshot } from "#/server/rooms.server";

const AVATAR_COLORS = [
	"#4fb8b2",
	"#2f6a4a",
	"#328f97",
	"#c17e2a",
	"#a85fb0",
	"#6ec89a",
	"#4a7bc8",
	"#c1574a",
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
							? "ring-2 ring-offset-2 ring-[var(--lagoon-deep)] ring-offset-[var(--header-bg)]"
							: ""
					}`}
					style={{ backgroundColor: colorForId(participant.id) }}
				>
					{initials(participant.name)}
				</div>
				{showCheck && (
					<span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[11px] leading-none text-white ring-2 ring-[var(--header-bg)]">
						✓
					</span>
				)}
				{showVote && (
					<span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--lagoon-deep)] px-1 text-[10px] font-bold leading-none text-white ring-2 ring-[var(--header-bg)]">
						{participant.vote ?? "–"}
					</span>
				)}
			</div>
			<span className="max-w-12 truncate text-[10px] text-[var(--sea-ink-soft)]">
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
		<nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--header-bg)] backdrop-blur-lg">
			{expanded && overflow.length > 0 && (
				<div className="absolute inset-x-4 bottom-full mb-2 max-h-64 overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--header-bg)] p-3 shadow-[0_-8px_24px_rgba(23,58,64,0.14)] backdrop-blur-lg">
					<p className="island-kicker mb-2">Más participantes</p>
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
										<span className="demo-pill">✓</span>
									) : (
										<span className="demo-muted text-xs">esperando</span>
									))}
								{snapshot.status === "revealed" && (
									<span className="demo-pill">{p.vote ?? "–"}</span>
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
							className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] text-sm font-bold text-[var(--sea-ink)] transition hover:-translate-y-0.5"
						>
							+{overflow.length}
						</button>
						<span className="text-[10px] text-[var(--sea-ink-soft)]">más</span>
					</li>
				)}
			</ul>
		</nav>
	);
}

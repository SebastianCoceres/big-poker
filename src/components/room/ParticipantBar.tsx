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

export function ParticipantBar({ snapshot }: { snapshot: RoomSnapshot }) {
	return (
		<nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--header-bg)] backdrop-blur-lg">
			<ul className="mx-auto flex max-w-3xl list-none items-start gap-3 overflow-x-auto px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
				{snapshot.participants.map((p) => {
					const showCheck = snapshot.status === "voting" && p.hasVoted;
					const showVote = snapshot.status === "revealed";
					return (
						<li
							key={p.id}
							className="flex flex-shrink-0 flex-col items-center gap-1"
							title={p.name}
						>
							<div
								className={`relative flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white transition ${
									p.connected ? "" : "opacity-40"
								} ${
									p.isMaster
										? "ring-2 ring-offset-2 ring-[var(--lagoon-deep)] ring-offset-[var(--header-bg)]"
										: ""
								}`}
								style={{ backgroundColor: colorForId(p.id) }}
							>
								{initials(p.name)}
								{showCheck && (
									<span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[11px] leading-none text-white ring-2 ring-[var(--header-bg)]">
										✓
									</span>
								)}
								{showVote && (
									<span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--lagoon-deep)] px-1 text-[10px] font-bold leading-none text-white ring-2 ring-[var(--header-bg)]">
										{p.vote ?? "–"}
									</span>
								)}
							</div>
							<span className="max-w-12 truncate text-[10px] text-[var(--sea-ink-soft)]">
								{p.name}
							</span>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}

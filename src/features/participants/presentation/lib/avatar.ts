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

/** Stable per-participant avatar color, hashed from their id so it survives reconnects. */
export function colorForId(id: string): string {
	let hash = 0;
	for (let i = 0; i < id.length; i++) {
		hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
	}
	return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function initials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "?";
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[1][0]).toUpperCase();
}

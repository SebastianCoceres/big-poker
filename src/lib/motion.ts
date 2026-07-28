// One spring signature drives every "island" surface in the app (the bottom
// ParticipantBar, the top RoomControlIsland) — an item joining or leaving,
// an affordance appearing, the whole shape resizing on expand/collapse.
// Same feel everywhere, not a different easing per component.
export const ISLAND_SPRING = {
	type: "spring",
	stiffness: 420,
	damping: 34,
	mass: 0.8,
} as const;

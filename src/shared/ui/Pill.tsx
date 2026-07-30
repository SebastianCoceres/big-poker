import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Small rounded chip for a compact status or value (a vote, a checkmark). */
export function Pill({
	className,
	...props
}: HTMLAttributes<HTMLSpanElement>) {
	return (
		<span
			className={cn(
				"border-chip-line bg-chip text-ink-soft inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-bold",
				className,
			)}
			{...props}
		/>
	);
}

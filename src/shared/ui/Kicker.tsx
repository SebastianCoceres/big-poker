import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Small uppercase eyebrow label used above a heading or value. */
export function Kicker({
	className,
	...props
}: HTMLAttributes<HTMLParagraphElement>) {
	return (
		<p
			className={cn(
				"text-kicker text-[0.69rem] font-bold tracking-[0.16em] uppercase",
				className,
			)}
			{...props}
		/>
	);
}

import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const fieldClassName =
	"border-line bg-surface-strong text-ink w-full rounded-[0.85rem] border px-3.5 py-2.5 outline-none transition-colors focus:border-blue-deep focus:ring-2 focus:ring-blue/25";

export function Field({
	className,
	...props
}: InputHTMLAttributes<HTMLInputElement>) {
	return <input className={cn(fieldClassName, className)} {...props} />;
}

export function TextField({
	className,
	...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
	return <textarea className={cn(fieldClassName, className)} {...props} />;
}

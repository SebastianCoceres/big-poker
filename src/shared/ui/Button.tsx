import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm leading-none font-bold transition hover:-translate-y-0.5 hover:brightness-90 disabled:pointer-events-none disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55",
  {
    variants: {
      variant: {
        primary: "border-transparent bg-blue text-white",
        secondary: "border-blue/55 bg-transparent text-blue-deep",
        danger: "border-red-500/30 bg-red-500/10 text-red-800",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

export interface ButtonProps
  extends
    ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

/** The app's one button primitive — plain Tailwind utilities via cva, so a caller's className always wins (twMerge) instead of losing to a hand-rolled CSS class. */
export function Button({
  className,
  variant,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant }), className)}
      {...props}
    />
  );
}

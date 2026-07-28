import { useState } from "react";

const ARM_RESET_MS = 3000;

/**
 * Destructive action with a two-tap confirm: first click arms it ("¿Seguro?
 * Sí, [label]"), a second click within ARM_RESET_MS confirms and runs
 * onConfirm. No click within that window quietly disarms — mirrors the
 * transient local-state + setTimeout pattern the copy-code button already
 * used, just applied to a confirm instead of a "copied" acknowledgement.
 */
export function ConfirmButton({
	label,
	confirmLabel,
	onConfirm,
	className,
}: {
	label: string;
	confirmLabel: string;
	onConfirm: () => void;
	className?: string;
}) {
	const [armed, setArmed] = useState(false);

	function handleClick() {
		if (!armed) {
			setArmed(true);
			setTimeout(() => setArmed(false), ARM_RESET_MS);
			return;
		}
		setArmed(false);
		onConfirm();
	}

	return (
		<button type="button" onClick={handleClick} className={className}>
			{armed ? confirmLabel : label}
		</button>
	);
}

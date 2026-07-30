import { useNavigate } from "@tanstack/react-router";
import { leaveRoomFn } from "#/features/participants/infrastructure/participant.controllers";
import { buttonVariants } from "#/shared/ui/Button";
import { ConfirmButton } from "#/shared/ui/ConfirmButton";

export function LeaveRoomButton({
	code,
	participantId,
}: {
	code: string;
	participantId: string;
}) {
	const navigate = useNavigate();

	async function handleLeave() {
		await leaveRoomFn({ data: { code, participantId } });
		// Unmounts RoomPage, which closes this tab's EventSource in
		// useRoomStream's cleanup — no separate "did I really leave" signal
		// needed, we're navigating away regardless of the result.
		navigate({ to: "/" });
	}

	return (
		<div className="flex justify-end">
			<ConfirmButton
				label="Salir de la sala"
				confirmLabel="¿Seguro? Sí, salir"
				onConfirm={handleLeave}
				className={buttonVariants({ variant: "secondary" })}
			/>
		</div>
	);
}

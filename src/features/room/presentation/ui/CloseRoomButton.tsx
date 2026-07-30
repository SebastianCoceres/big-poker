import { closeRoomFn } from "#/features/room/infrastructure/room.controllers";
import { buttonVariants } from "#/shared/ui/Button";
import { ConfirmButton } from "#/shared/ui/ConfirmButton";

export function CloseRoomButton({
	code,
	participantId,
}: {
	code: string;
	participantId: string;
}) {
	function handleClose() {
		closeRoomFn({ data: { code, participantId } });
	}

	return (
		<ConfirmButton
			label="Cerrar sala"
			confirmLabel="¿Seguro? Sí, cerrar"
			onConfirm={handleClose}
			className={buttonVariants({ variant: "danger" })}
		/>
	);
}

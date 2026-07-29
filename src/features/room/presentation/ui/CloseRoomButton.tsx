import { closeRoomFn } from "#/features/room/infrastructure/room.controllers";
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
			className="btn btn-danger"
		/>
	);
}

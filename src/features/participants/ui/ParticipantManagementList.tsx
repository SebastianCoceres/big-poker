import { kickParticipantFn } from "#/features/participants/interface-adapters/participant.controllers";
import type { RoomSnapshot } from "#/features/room/domain/entities";
import { ConfirmButton } from "#/shared/ui/ConfirmButton";

/** The room-control island's "who's here" list, with a per-row "Eliminar" (kick). */
export function ParticipantManagementList({
	code,
	participantId,
	others,
}: {
	code: string;
	participantId: string;
	others: RoomSnapshot["participants"];
}) {
	function handleKick(targetId: string) {
		kickParticipantFn({ data: { code, participantId, targetId } });
	}

	if (others.length === 0) return null;

	return (
		<div>
			<p className="kicker mb-2">Participantes</p>
			<ul className="flex flex-col gap-2">
				{others.map((p) => (
					<li
						key={p.id}
						className="flex items-center justify-between gap-3 text-sm"
					>
						<span className={p.connected ? "" : "opacity-40"}>{p.name}</span>
						<ConfirmButton
							label="Eliminar"
							confirmLabel="¿Seguro?"
							onConfirm={() => handleKick(p.id)}
							className="btn btn-danger px-3 py-1.5 text-xs"
						/>
					</li>
				))}
			</ul>
		</div>
	);
}

import type { RoomSnapshot } from "#/features/room/domain/entities";
import type { ConnectionState } from "#/features/room/hooks/useRoomStream";

export function ConnectionBanner({
	connectionState,
	snapshot,
	myId,
}: {
	connectionState: ConnectionState;
	snapshot: RoomSnapshot | null;
	myId: string;
}) {
	if (connectionState === "reconnecting") {
		return <p className="text-warning text-sm">Reconectando...</p>;
	}

	const master = snapshot?.participants.find((p) => p.isMaster);
	if (
		snapshot &&
		snapshot.status !== "revealed" &&
		master &&
		!master.connected &&
		master.id !== myId
	) {
		return (
			<p className="text-warning text-sm">
				El master se desconectó. Podés seguir votando, pero hace falta que
				vuelva para revelar o iniciar la próxima ronda.
			</p>
		);
	}

	return null;
}

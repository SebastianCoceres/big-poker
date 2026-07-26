import type { ConnectionState } from "#/hooks/useRoomStream";
import type { RoomSnapshot } from "#/server/rooms.server";

export function ConnectionBanner({
	connectionState,
	snapshot,
	myId,
}: {
	connectionState: ConnectionState;
	snapshot: RoomSnapshot | null;
	myId: string;
}) {
	if (connectionState === "room-gone") {
		return (
			<p className="demo-alert demo-alert-danger text-sm">
				Esta sala ya no existe (probablemente el servidor se reinició).{" "}
				<a href="/" className="font-semibold underline">
					Creá una sala nueva
				</a>
				.
			</p>
		);
	}

	if (connectionState === "reconnecting") {
		return <p className="demo-alert text-sm">Reconectando...</p>;
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
			<p className="demo-alert text-sm">
				El master se desconectó. Podés seguir votando, pero hace falta que
				vuelva para revelar o iniciar la próxima ronda.
			</p>
		);
	}

	return null;
}

import { useEffect, useState } from "react";
import type { RoomSnapshot } from "#/server/rooms.server";

export type ConnectionState =
	| "connecting"
	| "connected"
	| "reconnecting"
	| "room-gone";

export function useRoomStream(code: string, participantId: string | null) {
	const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
	const [connectionState, setConnectionState] =
		useState<ConnectionState>("connecting");

	useEffect(() => {
		if (!participantId) return;

		setConnectionState("connecting");
		const es = new EventSource(
			`/api/rooms/${code}/events?participantId=${encodeURIComponent(participantId)}`,
		);

		es.addEventListener("snapshot", (event) => {
			setSnapshot(JSON.parse((event as MessageEvent).data));
			setConnectionState("connected");
		});

		es.onerror = () => {
			// Per the EventSource spec: a non-200 response or bad content-type
			// closes the connection for good (readyState CLOSED, no retry) — that
			// is our signal the room is gone. Anything else means the browser is
			// about to retry on its own (readyState stays CONNECTING).
			setConnectionState(
				es.readyState === EventSource.CLOSED ? "room-gone" : "reconnecting",
			);
		};

		return () => es.close();
	}, [code, participantId]);

	return { snapshot, connectionState };
}

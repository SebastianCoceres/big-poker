import { createFileRoute } from "@tanstack/react-router";
import { normalizeRoomCode } from "#/lib/room-code";
import { getRoom, subscribe, toSnapshotForCode } from "#/server/rooms.server";

const HEARTBEAT_INTERVAL_MS = 25_000;

export const Route = createFileRoute("/api/rooms/$roomCode/events")({
	server: {
		handlers: {
			GET: async ({ params, request }) => {
				const code = normalizeRoomCode(params.roomCode);
				const participantId = new URL(request.url).searchParams.get(
					"participantId",
				);
				if (!participantId) {
					return new Response("participantId is required", { status: 400 });
				}

				if (!getRoom(code)) {
					// No retry from EventSource on a non-200 response — the client
					// treats this as "the room is gone", not a transient drop.
					return new Response("Room not found", { status: 404 });
				}

				const encoder = new TextEncoder();
				let unsubscribe = () => {};
				let heartbeat: ReturnType<typeof setInterval> | undefined;

				const stream = new ReadableStream({
					start(controller) {
						const send = (event: string, payload: unknown) => {
							controller.enqueue(
								encoder.encode(
									`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`,
								),
							);
						};

						// Subscribe FIRST, then snapshot — otherwise this connection's own
						// "connected" flag would be stale (computed before it existed).
						unsubscribe = subscribe(code, participantId, send);
						const initialSnapshot = toSnapshotForCode(code, participantId);
						if (initialSnapshot) send("snapshot", initialSnapshot);

						heartbeat = setInterval(() => {
							try {
								controller.enqueue(encoder.encode(": ping\n\n"));
							} catch {
								if (heartbeat) clearInterval(heartbeat);
							}
						}, HEARTBEAT_INTERVAL_MS);

						request.signal.addEventListener("abort", () => {
							if (heartbeat) clearInterval(heartbeat);
							unsubscribe();
						});
					},
					cancel() {
						if (heartbeat) clearInterval(heartbeat);
						unsubscribe();
					},
				});

				return new Response(stream, {
					headers: {
						"Content-Type": "text/event-stream",
						"Cache-Control": "no-cache, no-transform",
						Connection: "keep-alive",
					},
				});
			},
		},
	},
});

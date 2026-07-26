import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CardBoard } from "#/components/room/CardBoard";
import { ConnectionBanner } from "#/components/room/ConnectionBanner";
import { JoinForm } from "#/components/room/JoinForm";
import { ParticipantBar } from "#/components/room/ParticipantBar";
import { QuestionPanel } from "#/components/room/QuestionPanel";
import { ResultsPanel } from "#/components/room/ResultsPanel";
import { WaitingState } from "#/components/room/WaitingState";
import { useParticipantIdentity } from "#/hooks/useParticipantIdentity";
import { useRoomStream } from "#/hooks/useRoomStream";
import { normalizeRoomCode } from "#/lib/room-code";
import { joinRoomFn } from "#/server/rooms.functions";
import type { RoomSnapshot } from "#/server/rooms.server";

export const Route = createFileRoute("/room/$roomCode")({
	component: RoomPage,
});

function RoomPage() {
	const { roomCode } = Route.useParams();
	const code = normalizeRoomCode(roomCode);

	const { identity, setIdentity, hydrated } = useParticipantIdentity(code);
	const { snapshot, connectionState } = useRoomStream(
		code,
		identity?.participantId ?? null,
	);

	// If our identity is saved locally but the server doesn't recognize it
	// (process restarted and the room was re-created under the same code by
	// someone else, or we never actually completed joining), retry once.
	const [rejoinAttempted, setRejoinAttempted] = useState(false);
	useEffect(() => {
		if (!identity || !snapshot) return;
		const amIKnown = snapshot.participants.some(
			(p) => p.id === identity.participantId,
		);
		if (amIKnown || rejoinAttempted) return;
		setRejoinAttempted(true);
		joinRoomFn({
			data: {
				code,
				participantId: identity.participantId,
				name: identity.name,
			},
		});
	}, [identity, snapshot, code, rejoinAttempted]);

	// Avoids flashing the join form for a returning participant before we've
	// had a chance to read localStorage (SSR always renders with no identity).
	if (!hydrated) return null;

	if (!identity) {
		return (
			<main className="page-wrap px-4 pb-8 pt-14">
				<JoinForm code={code} onJoined={setIdentity} />
			</main>
		);
	}

	return (
		<>
			{/* pb reserves room for the fixed ParticipantBar below so the last
			    card/panel never sits underneath it. */}
			<main className="page-wrap flex flex-col gap-4 px-4 pb-32 pt-6">
				<ConnectionBanner
					connectionState={connectionState}
					snapshot={snapshot}
					myId={identity.participantId}
				/>
				{!snapshot && connectionState === "connecting" && (
					<p className="demo-muted rise-in text-sm">Conectando a la sala...</p>
				)}
				{snapshot && (
					<RoomBody
						snapshot={snapshot}
						myId={identity.participantId}
						code={code}
					/>
				)}
			</main>
			{snapshot && <ParticipantBar snapshot={snapshot} />}
		</>
	);
}

function RoomBody({
	snapshot,
	myId,
	code,
}: {
	snapshot: RoomSnapshot;
	myId: string;
	code: string;
}) {
	const me = snapshot.participants.find((p) => p.id === myId);
	const isMaster = me?.isMaster ?? false;

	return (
		<div className="flex flex-col gap-4">
			{isMaster && (
				<QuestionPanel code={code} participantId={myId} snapshot={snapshot} />
			)}
			{snapshot.status === "waiting" && !isMaster && <WaitingState />}
			{snapshot.status === "voting" && (
				<CardBoard code={code} participantId={myId} snapshot={snapshot} />
			)}
			{snapshot.status === "revealed" && <ResultsPanel snapshot={snapshot} />}
		</div>
	);
}

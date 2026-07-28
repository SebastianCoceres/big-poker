import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { RoomSnapshot } from "#/features/room/domain/entities";
import { normalizeRoomCode } from "#/features/room/domain/room-code";
import { useParticipantIdentity } from "#/features/room/hooks/useParticipantIdentity";
import { useRoomStream } from "#/features/room/hooks/useRoomStream";
import { joinRoomFn } from "#/features/room/interface-adapters/room.controllers";
import { CardBoard } from "#/features/room/ui/CardBoard";
import { ConnectionBanner } from "#/features/room/ui/ConnectionBanner";
import { JoinForm } from "#/features/room/ui/JoinForm";
import { LeaveRoomButton } from "#/features/room/ui/LeaveRoomButton";
import { ParticipantBar } from "#/features/room/ui/ParticipantBar";
import { QuestionPanel } from "#/features/room/ui/QuestionPanel";
import { ResultsPanel } from "#/features/room/ui/ResultsPanel";
import { RoomControlIsland } from "#/features/room/ui/RoomControlIsland";
import { RoomEndedView } from "#/features/room/ui/RoomEndedView";
import { WaitingState } from "#/features/room/ui/WaitingState";

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
			<main className="page-wrap flex h-dvh flex-col items-center justify-center px-4">
				<JoinForm code={code} onJoined={setIdentity} />
			</main>
		);
	}

	// Terminal connection states take over the whole screen instead of
	// banner-ing over stale room content below them.
	if (
		connectionState === "room-gone" ||
		connectionState === "closed" ||
		connectionState === "kicked"
	) {
		return <RoomEndedView state={connectionState} />;
	}

	return (
		<>
			{/* pb reserves room for the fixed ParticipantBar below so the last
			    section never sits underneath it. */}
			<main className="page-wrap flex h-dvh flex-col gap-4 px-4 pb-32 pt-6">
				<ConnectionBanner
					connectionState={connectionState}
					snapshot={snapshot}
					myId={identity.participantId}
				/>
				{!snapshot && connectionState === "connecting" && (
					<p className="text-muted rise-in text-sm">Conectando a la sala...</p>
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
		<div className="flex flex-1 flex-col gap-4">
			{isMaster ? (
				<RoomControlIsland
					code={code}
					participantId={myId}
					snapshot={snapshot}
				/>
			) : (
				<LeaveRoomButton code={code} participantId={myId} />
			)}
			{isMaster && snapshot.status === "waiting" && (
				<QuestionPanel code={code} participantId={myId} snapshot={snapshot} />
			)}
			{snapshot.status === "waiting" && !isMaster && <WaitingState />}
			{snapshot.status === "voting" && (
				<CardBoard code={code} participantId={myId} snapshot={snapshot} />
			)}
			{snapshot.status === "revealed" && (
				<ResultsPanel code={code} participantId={myId} snapshot={snapshot} />
			)}
		</div>
	);
}

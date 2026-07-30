import { ParticipantManagementList } from "#/features/participants/presentation/ui/ParticipantManagementList";
import type { RoomSnapshot } from "#/features/room/domain/entities";
import { RoomInfoTab } from "#/features/room/presentation/ui/RoomInfoTab";
import { Kicker } from "#/shared/ui/Kicker";
import {
	Modal,
	ModalBody,
	ModalContent,
	ModalTrigger,
} from "@/components/ui/animated-modal";
import { Tabs } from "@/components/ui/tabs";

/**
 * Master-only control surface for the room. The collapsed trigger is the
 * same "Dynamic Island" pill ParticipantBar uses at the bottom, sitting in
 * normal document flow at the top of RoomBody. Tapping it opens a
 * full-screen modal (Aceternity's animated-modal) with two tabs (Aceternity's
 * Tabs): room info (code, join QR, share, close) and the participant roster
 * (kick via tap-to-reveal).
 */
export function RoomControlIsland({
	code,
	participantId,
	snapshot,
}: {
	code: string;
	participantId: string;
	snapshot: RoomSnapshot;
}) {
	const others = snapshot.participants.filter((p) => p.id !== participantId);

	return (
		<Modal>
			<div className="rise-in flex justify-start">
				<ModalTrigger className="border-line bg-header shadow-ink/20 flex items-center gap-3 rounded-[1.75rem] border px-4 py-2.5 text-left shadow-2xl backdrop-blur-xl">
					<span className="text-left">
						<Kicker className="block">Código de sala</Kicker>
						<span className="text-ink text-lg font-bold tracking-[0.2em]">
							{code}
						</span>
					</span>
				</ModalTrigger>
			</div>

			<ModalBody className="bg-header h-full max-h-full min-h-full w-full max-w-none rounded-none border-0 md:max-w-none">
				<ModalContent className="mx-auto flex h-full w-full max-w-sm flex-col p-6 md:p-6">
					<Tabs
						tabs={[
							{
								title: "Info de la sala",
								value: "info",
								content: (
									<RoomInfoTab code={code} participantId={participantId} />
								),
							},
							{
								title:
									others.length > 0
										? `Participantes (${others.length})`
										: "Participantes",
								value: "participants",
								content: (
									<ParticipantManagementList
										code={code}
										participantId={participantId}
										others={others}
									/>
								),
							},
						]}
						tabClassName="text-sm py-1.5"
						contentClassName="mt-6 overflow-y-auto"
					/>
				</ModalContent>
			</ModalBody>
		</Modal>
	);
}

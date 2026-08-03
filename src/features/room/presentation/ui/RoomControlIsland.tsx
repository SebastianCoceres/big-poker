import { IconChevronRight, IconLayoutGrid } from "@tabler/icons-react";
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
        <ModalTrigger className="w-full border-line/15 bg-header/85 group flex flex-col gap-3 rounded-2xl border px-4 py-3.5 text-left shadow-[0_20px_45px_-15px_rgba(15,23,42,0.25),0_10px_35px_-10px_rgba(37,99,235,0.35)] backdrop-blur-xl transition hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-deep">
          <span className="flex items-center gap-3">
            <span className="border-blue/40 text-blue flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border">
              <IconLayoutGrid aria-hidden="true" className="h-5 w-5" />
            </span>
            <span className="flex-1 text-left">
              <Kicker className="block">Código de sala</Kicker>
              <span className="text-ink text-lg font-bold tracking-[0.2em]">
                {code}
              </span>
            </span>
            <IconChevronRight
              aria-hidden="true"
              className="text-ink-soft h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </span>
          <span className="border-line/25 border-t border-dashed" />
          <span className="text-ink-soft text-xs">
            Comparte este código para que otros se unan.
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

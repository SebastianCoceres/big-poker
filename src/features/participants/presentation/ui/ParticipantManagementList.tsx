import { motion } from "motion/react";
import { useState } from "react";
import { kickParticipantFn } from "#/features/participants/infrastructure/participant.controllers";
import {
  colorForId,
  initials,
} from "#/features/participants/presentation/lib/avatar";
import type { RoomSnapshot } from "#/features/room/domain/entities";
import { ISLAND_SPRING } from "#/shared/lib/motion";
import { Button } from "#/shared/ui/Button";

const REVEAL_WIDTH = 96;

/**
 * The "Participantes" tab: the room's roster, each row hiding its "Expulsar"
 * action behind a tap-to-reveal slide (iOS reveal-on-swipe look, without the
 * drag gesture) instead of showing it inline, so a stray tap can't kick
 * anyone by accident. Only one row stays open at a time.
 */
export function ParticipantManagementList({
  code,
  participantId,
  others,
}: {
  code: string;
  participantId: string;
  others: RoomSnapshot["participants"];
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  function handleKick(targetId: string) {
    setOpenId(null);
    kickParticipantFn({ data: { code, participantId, targetId } });
  }

  if (others.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 py-4 text-center">
        <p className="text-ink text-sm font-semibold">
          Todavía sos el único acá
        </p>
        <p className="text-muted text-sm">
          Compartí el código para que se sumen.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2 py-4">
      {others.map((p) => (
        <ParticipantRow
          key={p.id}
          participant={p}
          open={openId === p.id}
          onToggle={() =>
            setOpenId((current) => (current === p.id ? null : p.id))
          }
          onKick={() => handleKick(p.id)}
        />
      ))}
    </ul>
  );
}

function ParticipantRow({
  participant,
  open,
  onToggle,
  onKick,
}: {
  participant: RoomSnapshot["participants"][number];
  open: boolean;
  onToggle: () => void;
  onKick: () => void;
}) {
  return (
    <li className="relative overflow-hidden rounded-xl">
      <Button
        variant="danger"
        onClick={onKick}
        style={{ width: REVEAL_WIDTH }}
        className="absolute inset-y-0 right-0 rounded-none border-none"
      >
        Expulsar
      </Button>
      <motion.button
        type="button"
        onClick={onToggle}
        animate={{ x: open ? -REVEAL_WIDTH : 0 }}
        transition={ISLAND_SPRING}
        className="bg-surface-strong relative z-10 flex w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white transition-opacity ${
            participant.connected ? "" : "opacity-40"
          }`}
          style={{ backgroundColor: colorForId(participant.id) }}
        >
          {initials(participant.name)}
        </span>
        <span className="flex min-w-0 flex-col">
          <span
            className={`truncate text-sm font-medium ${
              participant.connected ? "text-ink" : "text-muted"
            }`}
          >
            {participant.name}
          </span>
          {!participant.connected && (
            <span className="text-muted text-xs">Desconectado</span>
          )}
        </span>
      </motion.button>
    </li>
  );
}

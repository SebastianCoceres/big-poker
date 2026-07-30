import QRCode from "react-qr-code";
import { CloseRoomButton } from "#/features/room/presentation/ui/CloseRoomButton";
import { CopyRoomCodeButton } from "#/features/room/presentation/ui/CopyRoomCodeButton";
import { ShareRoomButton } from "#/features/room/presentation/ui/ShareRoomButton";
import { Kicker } from "#/shared/ui/Kicker";

/** "Info de la sala" tab: the room code, a scannable join QR, and the two room-level actions. */
export function RoomInfoTab({
  code,
  participantId,
}: {
  code: string;
  participantId: string;
}) {
  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/room/${code}`
      : "";

  return (
    <div className="flex h-full flex-col py-4">
      <div className="flex items-center justify-between gap-3">
        <span>
          <Kicker className="block">Código de sala</Kicker>
          <span className="text-ink text-lg font-bold tracking-[0.2em]">
            {code}
          </span>
        </span>
        <CopyRoomCodeButton code={code} />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-muted text-sm">Escaneá para unirte</p>
        <div className="w-full max-w-[280px] rounded-2xl bg-white p-4">
          <QRCode value={joinUrl} className="h-auto w-full" />
        </div>
      </div>

      <div className="flex gap-2 *:flex-1">
        <ShareRoomButton code={code} />
        <CloseRoomButton code={code} participantId={participantId} />
      </div>
    </div>
  );
}

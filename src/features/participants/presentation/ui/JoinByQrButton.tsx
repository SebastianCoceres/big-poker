import { IconQrcode } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import QrScanner from "qr-scanner";
import { normalizeRoomCode } from "#/features/room/domain/room-code";
import { buttonVariants } from "#/shared/ui/Button";
import {
	Modal,
	ModalBody,
	ModalContent,
	ModalTrigger,
	useModal,
} from "@/components/ui/animated-modal";
import { cn } from "@/lib/utils";

/** Pulls a room code out of a scanned BigPoker join QR (`{origin}/room/{code}`). Anything else is not our QR. */
function extractRoomCode(decodedText: string): string | null {
	try {
		const url = new URL(decodedText);
		const match = url.pathname.match(/^\/room\/([^/]+)\/?$/);
		if (!match) return null;
		return normalizeRoomCode(decodeURIComponent(match[1]));
	} catch {
		return null;
	}
}

function ScannerView({ onScanned }: { onScanned: (code: string) => void }) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const [error, setError] = useState<string | null>(null);
	const { setOpen } = useModal();

	// biome-ignore lint/correctness/useExhaustiveDependencies: onScanned is a fresh closure each render by design (it captures the latest joinCode-submit function) — re-subscribing the camera on every render would restart the stream constantly.
	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		let cancelled = false;
		const scanner = new QrScanner(
			video,
			(result) => {
				const code = extractRoomCode(result.data);
				if (!code) {
					setError("Ese código QR no es de una sala de BigPoker.");
					return;
				}
				// Close first — the join itself is async and reports success/
				// failure back on the underlying form, same as manual entry.
				setOpen(false);
				onScanned(code);
			},
			{
				preferredCamera: "environment",
				highlightScanRegion: true,
				highlightCodeOutline: true,
			},
		);

		scanner.start().catch(() => {
			if (!cancelled) {
				setError(
					"No pudimos acceder a la cámara. Revisá los permisos del navegador.",
				);
			}
		});

		return () => {
			cancelled = true;
			scanner.destroy();
		};
	}, []);

	return (
		<div className="flex flex-col gap-3">
			<div className="overflow-hidden rounded-2xl bg-black">
				<video
					ref={videoRef}
					className="aspect-square w-full object-cover"
					muted
					autoPlay
					playsInline
				/>
			</div>
			{error && <p className="text-danger text-sm">{error}</p>}
		</div>
	);
}

/** "Unirse a sala" step's fast path: scan the master's QR instead of typing the 6-character code. */
export function JoinByQrButton({
	onScanned,
}: {
	onScanned: (code: string) => void;
}) {
	return (
		<Modal>
			<ModalTrigger
				className={cn(
					buttonVariants({ variant: "secondary" }),
					"w-full",
				)}
			>
				<IconQrcode className="h-4 w-4" aria-hidden="true" />
				Escanear código QR
			</ModalTrigger>

			{/* Portaled to <body> — a caller may place this trigger inside a
			    `.rise-in` (or any transform-animated) element, which would
			    otherwise become the containing block for this `fixed` modal
			    and trap it near the trigger instead of covering the viewport. */}
			{createPortal(
				<ModalBody className="bg-header h-full max-h-full min-h-full w-full max-w-none rounded-none border-0 md:max-w-none">
					<ModalContent className="mx-auto flex h-full w-full max-w-sm flex-col justify-center gap-4 p-6 md:p-6">
						<div>
							<h2 className="heading-sm mb-1">Escanear código QR</h2>
							<p className="text-muted text-sm">
								Apuntá la cámara al código QR de la sala.
							</p>
						</div>
						<ScannerView onScanned={onScanned} />
					</ModalContent>
				</ModalBody>,
				document.body,
			)}
		</Modal>
	);
}

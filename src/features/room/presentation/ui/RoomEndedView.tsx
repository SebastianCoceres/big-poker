import { cn } from "@/lib/utils";
import { buttonVariants } from "#/shared/ui/Button";
import { Kicker } from "#/shared/ui/Kicker";

type EndedState = "room-gone" | "closed" | "kicked";

const COPY: Record<
	EndedState,
	{ kicker: string; heading: string; body: string; cta: string }
> = {
	"room-gone": {
		kicker: "Sala no disponible",
		heading: "Esta sala ya no existe",
		body: "Probablemente el servidor se reinició.",
		cta: "Crear una sala nueva",
	},
	closed: {
		kicker: "Sala cerrada",
		heading: "El organizador cerró la sala",
		body: "Podés volver al inicio y crear o unirte a otra.",
		cta: "Volver al inicio",
	},
	kicked: {
		kicker: "Fuera de la sala",
		heading: "Te sacaron de esta sala",
		body: "Si te vuelven a invitar, podés unirte con el código.",
		cta: "Volver al inicio",
	},
};

/**
 * Terminal connection states (the room is gone, closed, or we were kicked)
 * take over the whole screen instead of banner-ing over stale room content —
 * there's nothing behind them worth showing anymore.
 */
export function RoomEndedView({ state }: { state: EndedState }) {
	const copy = COPY[state];

	return (
		<main className="page-wrap flex h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
			<Kicker>{copy.kicker}</Kicker>
			<h1 className="heading-lg text-2xl sm:text-3xl">{copy.heading}</h1>
			<p className="text-muted text-sm">{copy.body}</p>
			<a href="/" className={cn(buttonVariants(), "mt-3")}>
				{copy.cta}
			</a>
		</main>
	);
}

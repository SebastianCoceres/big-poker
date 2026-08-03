import bigtechLogo from "#/assets/bigtechlogo.png";
import type { CardValue } from "#/features/voting/domain/entities";

export function CardFace({ value }: { value: CardValue }) {
	return (
		<div className="playing-card text-ink isolate relative flex h-full w-full select-none flex-col items-center justify-center overflow-hidden">
			<div
				aria-hidden
				className="card-watermark pointer-events-none absolute"
				style={{
					inset: "-50%",
					transform: "rotate(-18deg)",
					backgroundImage: `url(${bigtechLogo})`,
					backgroundRepeat: "repeat",
					backgroundSize: "90px auto",
					opacity: 0.2,
				}}
			/>
			<span className="absolute top-2 left-2 flex flex-col items-start gap-1">
				<span className="text-base leading-none font-bold">{value}</span>
				<span className="bg-blue h-2 w-2 rounded-xs" />
			</span>
			<span className="absolute right-2 bottom-2 flex rotate-180 flex-col items-start gap-1">
				<span className="text-base leading-none font-bold">{value}</span>
				<span className="bg-blue h-2 w-2 rounded-xs" />
			</span>
			<span className="border-blue bg-white text-slate-900 relative flex w-20 max-w-full aspect-square items-center justify-center rounded-full border-2 text-3xl font-bold">
				{value}
			</span>
		</div>
	);
}

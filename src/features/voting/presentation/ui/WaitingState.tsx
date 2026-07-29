export function WaitingState() {
	return (
		<div className="rise-in flex flex-1 flex-col items-center justify-center gap-2 py-12 text-center">
			<p className="kicker">Esperando</p>
			<h2 className="heading-sm text-lg">
				El master todavía no inició una ronda
			</h2>
			<p className="text-muted text-sm">
				En cuanto escriba la primera pregunta vas a poder votar acá.
			</p>
		</div>
	);
}

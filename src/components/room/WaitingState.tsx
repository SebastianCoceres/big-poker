export function WaitingState() {
	return (
		<div className="demo-panel rise-in flex flex-col items-center gap-2 py-12 text-center">
			<p className="island-kicker">Esperando</p>
			<h2 className="demo-section-title text-lg">
				El master todavía no inició una ronda
			</h2>
			<p className="demo-muted text-sm">
				En cuanto escriba la primera pregunta vas a poder votar acá.
			</p>
		</div>
	);
}

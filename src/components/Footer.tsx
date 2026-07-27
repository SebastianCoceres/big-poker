export default function Footer() {
	const year = new Date().getFullYear();

	return (
		<footer className="border-line text-ink-soft mt-20 border-t px-4 pb-14 pt-10">
			<div className="page-wrap flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
				<p className="m-0 text-sm">&copy; {year} BigPoker</p>
				<p className="kicker m-0">Sin cuentas, sin dashboard</p>
			</div>
		</footer>
	);
}

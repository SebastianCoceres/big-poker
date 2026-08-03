import { useEffect } from "react";

/** Registers the PWA service worker once on mount. No UI of its own. */
export function ServiceWorkerRegistration() {
	useEffect(() => {
		if ("serviceWorker" in navigator) {
			navigator.serviceWorker.register("/sw.js");
		}
	}, []);
	return null;
}

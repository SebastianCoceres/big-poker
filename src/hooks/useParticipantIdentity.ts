import { useCallback, useEffect, useState } from "react";

export interface ParticipantIdentity {
	participantId: string;
	name: string;
}

function storageKey(code: string): string {
	return `bigpoker:room:${code}:me`;
}

export function readParticipantIdentity(
	code: string,
): ParticipantIdentity | null {
	try {
		const raw = window.localStorage.getItem(storageKey(code));
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (
			typeof parsed?.participantId === "string" &&
			typeof parsed?.name === "string"
		) {
			return parsed;
		}
		return null;
	} catch {
		return null;
	}
}

export function writeParticipantIdentity(
	code: string,
	identity: ParticipantIdentity,
): void {
	window.localStorage.setItem(storageKey(code), JSON.stringify(identity));
}

/**
 * Persists this browser tab's identity for a room across refreshes/reconnects.
 * Always starts `null` (SSR has no `localStorage`) and hydrates in an effect
 * so the server-rendered markup and the client's first paint match.
 */
export function useParticipantIdentity(code: string) {
	const [identity, setIdentityState] = useState<ParticipantIdentity | null>(
		null,
	);
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		setIdentityState(readParticipantIdentity(code));
		setHydrated(true);
	}, [code]);

	const setIdentity = useCallback(
		(next: ParticipantIdentity) => {
			writeParticipantIdentity(code, next);
			setIdentityState(next);
		},
		[code],
	);

	return { identity, setIdentity, hydrated };
}

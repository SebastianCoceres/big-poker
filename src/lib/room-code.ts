// Excludes 0/O/1/I so a code can be read aloud in a meeting without ambiguity.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

export function generateRoomCode(): string {
	let code = "";
	for (let i = 0; i < CODE_LENGTH; i++) {
		code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
	}
	return code;
}

export function normalizeRoomCode(code: string): string {
	return code.trim().toUpperCase();
}

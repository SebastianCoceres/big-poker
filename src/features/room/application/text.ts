export function cleanText(value: string, maxLength: number): string | null {
	const trimmed = value.trim();
	if (trimmed.length < 1 || trimmed.length > maxLength) return null;
	return trimmed;
}

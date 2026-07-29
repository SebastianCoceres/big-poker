import type { RoomErrorCode } from "./errors";

export type Result<T> =
	| { ok: true; data: T }
	| { ok: false; error: RoomErrorCode };

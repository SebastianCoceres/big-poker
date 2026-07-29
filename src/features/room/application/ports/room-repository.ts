import type { Room } from "../../domain/entities";

/**
 * Persistence for the `Room` aggregate only — no timers, no pub/sub. Those
 * are the `RoomRealtimeGateway`'s job.
 */
export interface RoomRepository {
	findByCode(code: string): Room | undefined;
	save(room: Room): void;
	delete(code: string): void;
	/**
	 * Beyond the plan's literal 3-method sketch: needed by the infrastructure
	 * gateway's periodic 6h sweep (`ensureCleanupTimer` in the original
	 * `rooms.server.ts`), which has to walk every room to find abandoned ones.
	 * There is no way to preserve that behavior without some form of
	 * enumeration on the repository.
	 */
	listAll(): Room[];
}

/**
 * Thin, server-only persistence store for sharing-link operations.
 * All functions are narrow — session CRUD and paid-status toggles only.
 * No business logic lives here; routes call these for data access.
 */
import { getDataSource } from '../db/data-source.server.js';
import { Session } from '../db/entities/Session.js';
import { PaidStatus } from '../db/entities/PaidStatus.js';

export interface SessionPayload {
	sessionTitle: string;
	sessionDate: string;
	startTime: string;
	courtHours: number;
	courtPrice: number;
	shuttlecockPrice: number;
	shuttlecockCount: number;
	additionalCosts: Array<{ label: string; amount: number }>;
	players: Array<{
		id: number;
		name: string;
		hours: number;
		arrivalOffsetMinutes: number;
	}>;
}

/** Load a session by its UUID. Returns null if not found. */
export async function findSessionById(id: string): Promise<Session | null> {
	const ds = await getDataSource();
	return ds.getRepository(Session).findOne({ where: { id } });
}

/** Load a session by its canonical content hash. Returns null if not found. */
export async function findSessionByContentHash(hash: string): Promise<Session | null> {
	const ds = await getDataSource();
	return ds.getRepository(Session).findOne({ where: { contentHash: hash } });
}

/**
 * Create a new session or return the existing one for the given hash.
 * Caller computes and passes the canonical content hash.
 */
export async function createOrReuseSession(
	hash: string,
	payload: SessionPayload
): Promise<Session> {
	const ds = await getDataSource();
	const repo = ds.getRepository(Session);

	const existing = await repo.findOne({ where: { contentHash: hash } });
	if (existing) return existing;

	const session = repo.create({ contentHash: hash, data: payload as unknown as Record<string, unknown> });
	return repo.save(session);
}

/** List paid player IDs for a session. Returns empty array if none. */
export async function listPaidPlayerIds(sessionId: string): Promise<number[]> {
	const ds = await getDataSource();
	const rows = await ds.getRepository(PaidStatus).find({ where: { sessionId } });
	return rows.map((r) => r.playerId);
}

/**
 * Mark a player as paid for a session.
 * Idempotent — inserting the same (sessionId, playerId) pair replaces the existing row.
 */
export async function markPaid(sessionId: string, playerId: number): Promise<void> {
	const ds = await getDataSource();
	const repo = ds.getRepository(PaidStatus);
	await repo.save(repo.create({ sessionId, playerId, paidAt: new Date() }));
}

/** Remove a player's paid status for a session. */
export async function unmarkPaid(sessionId: string, playerId: number): Promise<void> {
	const ds = await getDataSource();
	await ds.getRepository(PaidStatus).delete({ sessionId, playerId });
}

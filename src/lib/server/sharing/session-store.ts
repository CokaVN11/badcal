/**
 * Thin, server-only persistence store for sharing-link operations.
 * All functions are narrow — session CRUD and paid-status toggles only.
 * No business logic lives here; routes call these for data access.
 */
import { getPrisma } from '../db/prisma.server.js';
import type { Session, PaidStatus } from '../../../../generated/prisma/client.js';
import type { Prisma } from '../../../../generated/prisma/client.js';

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
	return getPrisma().session.findUnique({ where: { id } });
}

/** Load a session by its canonical content hash. Returns null if not found. */
export async function findSessionByContentHash(hash: string): Promise<Session | null> {
	return getPrisma().session.findUnique({ where: { contentHash: hash } });
}

/**
 * Create a new session or return the existing one for the given hash.
 * Caller computes and passes the canonical content hash.
 */
export async function createOrReuseSession(
	hash: string,
	payload: SessionPayload
): Promise<Session> {
	const prisma = getPrisma();

	const existing = await prisma.session.findUnique({ where: { contentHash: hash } });
	if (existing) return existing;

	return prisma.session.create({ data: { contentHash: hash, data: payload as unknown as Prisma.InputJsonValue } });
}

/** List paid player IDs for a session. Returns empty array if none. */
export async function listPaidPlayerIds(sessionId: string): Promise<number[]> {
	const rows = await getPrisma().paidStatus.findMany({ where: { sessionId } });
	return rows.map((r: PaidStatus) => r.playerId);
}

/**
 * Mark a player as paid for a session.
 * Idempotent — upsert handles the same (sessionId, playerId) pair safely.
 */
export async function markPaid(sessionId: string, playerId: number): Promise<void> {
	await getPrisma().paidStatus.upsert({
		where: { sessionId_playerId: { sessionId, playerId } },
		create: { sessionId, playerId, paidAt: new Date() },
		update: { paidAt: new Date() },
	});
}

/** Remove a player's paid status for a session. */
export async function unmarkPaid(sessionId: string, playerId: number): Promise<void> {
	await getPrisma().paidStatus.delete({
		where: { sessionId_playerId: { sessionId, playerId } },
	});
}

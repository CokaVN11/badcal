/**
 * Thin, server-only persistence store for sharing-link operations.
 * All functions are narrow — session CRUD and paid-status toggles only.
 * No business logic lives here; routes call these for data access.
 */
import { getPrisma } from '../db/prisma.server.js';
import type {
	CourtBlock,
	Group,
	ExtraCost,
	PaidStatus
} from '../../../../generated/prisma/client.js';
import { PrismaClientKnownRequestError } from '../../../../generated/prisma/internal/prismaNamespace.js';

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

/** Load a session by its UUID with all relations. */
export async function findSessionById(id: string) {
	return getPrisma().session.findUnique({
		where: { id },
		include: { courtBlocks: true, groups: true, extraCosts: true }
	});
}

export async function findSessionWithRelations(id: string) {
	return getPrisma().session.findUnique({
		where: { id },
		include: { courtBlocks: true, groups: true, extraCosts: true, paidStatuses: true }
	});
}

/** Load a session by its canonical content hash with all relations. */
export async function findSessionByContentHash(hash: string) {
	return getPrisma().session.findUnique({
		where: { contentHash: hash },
		include: { courtBlocks: true, groups: true, extraCosts: true }
	});
}

/**
 * Create a new session or return the existing one for the given hash.
 * Caller computes and passes the canonical content hash.
 */
export async function createOrReuseSession(
	hash: string,
	payload: {
		sessionTitle: string;
		sessionDate: string;
		courtBlocks: Omit<CourtBlock, 'id' | 'sessionId'>[];
		groups: Omit<Group, 'id' | 'sessionId'>[];
		extraCosts: Omit<ExtraCost, 'id' | 'sessionId'>[];
	}
) {
	const prisma = getPrisma();
	try {
		const session = await prisma.session.create({
				data: { contentHash: hash, sessionTitle: payload.sessionTitle, sessionDate: payload.sessionDate }
			});
		await prisma.courtBlock.createMany({
			data: payload.courtBlocks.map((cb) => ({ ...cb, sessionId: session.id }))
		});
		await prisma.group.createMany({
			data: payload.groups.map((g) => ({ ...g, sessionId: session.id }))
		});
		await prisma.extraCost.createMany({
			data: payload.extraCosts.map((ec) => ({ ...ec, sessionId: session.id }))
		});
		return session;
	} catch (e: unknown) {
		if (e instanceof PrismaClientKnownRequestError && e.code === 'P2002') {
			return prisma.session.findUnique({ where: { contentHash: hash } });
		}
		throw e;
	}
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
		update: { paidAt: new Date() }
	});
}

/** Remove a player's paid status for a session. */
export async function unmarkPaid(sessionId: string, playerId: number): Promise<void> {
	await getPrisma().paidStatus.delete({
		where: { sessionId_playerId: { sessionId, playerId } }
	});
}

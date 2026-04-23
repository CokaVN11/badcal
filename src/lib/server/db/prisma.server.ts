import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../../../generated/prisma/client.js';
import { DATABASE_URL } from '$env/static/private';

let _prisma: PrismaClient | undefined;

export function getPrisma(): PrismaClient {
	if (!_prisma) {
		const adapter = new PrismaPg({ connectionString: DATABASE_URL });
		_prisma = new PrismaClient({ adapter });

		// Log connection success/failure
		_prisma.$connect()
			.then(() => console.log('[Prisma] Connected to database successfully'))
			.catch((err) => console.error('[Prisma] Database connection failed:', err));
	}
	return _prisma;
}

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Session } from './entities/Session.js';
import { PaidStatus } from './entities/PaidStatus.js';

const _dbUrl = process.env.DATABASE_URL;
if (!_dbUrl) throw new Error('DATABASE_URL environment variable is not set');
const DATABASE_URL: string = _dbUrl;

/**
 * Singleton DataSource for serverless-safe TypeORM access.
 * Lives at module scope — initialized once, reused across all route handlers.
 * Never imported from browser or client bundles.
 */
let _ds: DataSource | undefined;

export async function getDataSource(): Promise<DataSource> {
	if (!_ds) {
		_ds = new DataSource({
			type: 'postgres',
			url: DATABASE_URL,
			entities: [Session, PaidStatus],
			migrations: [],
			subscribers: [],
			synchronize: false,
			logging: false,
			ssl: DATABASE_URL.includes('localhost') === false ? { rejectUnauthorized: false } : false,
		});
		await _ds.initialize();
	}
	return _ds;
}

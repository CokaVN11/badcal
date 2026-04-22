/**
 * TypeORM CLI bootstrap — used only by package.json migration scripts.
 * Not imported by any application runtime code.
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { CreateSharingTables1745300000000 } from './migrations/1745300000000-CreateSharingTables.js';

const _url = process.env.DATABASE_URL;
if (!_url) throw new Error('DATABASE_URL environment variable is not set');

export const AppDataSource = new DataSource({
	type: 'postgres',
	url: _url,
	entities: [],
	migrations: [CreateSharingTables1745300000000],
	migrationsTableName: 'typeorm_migrations',
	subscribers: [],
	synchronize: false,
	logging: true,
	ssl: _url.includes('localhost') === false ? { rejectUnauthorized: false } : false,
});

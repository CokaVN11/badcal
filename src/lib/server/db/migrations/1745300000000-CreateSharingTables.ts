import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSharingTables1745300000000 implements MigrationInterface {
	name = 'CreateSharingTables1745300000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// Enable UUID generation via pgcrypto
		await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

		await queryRunner.query(`
      CREATE TABLE sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content_hash TEXT UNIQUE NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

		await queryRunner.query(`
      CREATE TABLE paid_status (
        session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        player_id INT NOT NULL,
        paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (session_id, player_id)
      )
    `);

		await queryRunner.query(`
      CREATE INDEX idx_sessions_content_hash ON sessions(content_hash)
    `);

		await queryRunner.query(`
      CREATE INDEX idx_paid_status_session ON paid_status(session_id)
    `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE IF EXISTS paid_status`);
		await queryRunner.query(`DROP TABLE IF EXISTS sessions`);
		await queryRunner.query(`DROP EXTENSION IF EXISTS pgcrypto`);
	}
}

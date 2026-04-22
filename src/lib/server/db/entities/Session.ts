import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	OneToMany,
	Index,
} from 'typeorm';
import { PaidStatus } from './PaidStatus.js';

@Entity('sessions')
export class Session {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	/** Canonical content hash for deterministic create-or-reuse */
	@Index('idx_sessions_content_hash')
	@Column({ type: 'text', unique: true })
	contentHash!: string;

	/** Full session payload — costs, players, timing */
	@Column({ type: 'jsonb' })
	data!: Record<string, unknown>;

	@CreateDateColumn({ type: 'timestamptz' })
	createdAt!: Date;

	@OneToMany(() => PaidStatus, (paid) => paid.session, { cascade: true })
	paidStatuses!: PaidStatus[];
}

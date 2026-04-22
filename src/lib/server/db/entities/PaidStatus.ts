import {
	Entity,
	PrimaryColumn,
	Column,
	ManyToOne,
	JoinColumn,
	Index,
} from 'typeorm';
import { Session } from './Session.js';

@Entity('paid_status')
@Index('idx_paid_status_session')
export class PaidStatus {
	/** References sessions.id */
	@PrimaryColumn({ type: 'uuid' })
	sessionId!: string;

	/** Player ID as stored inside Session.data — not a foreign key */
	@PrimaryColumn({ type: 'int' })
	playerId!: number;

	@Column({ type: 'timestamptz', default: () => 'now()' })
	paidAt!: Date;

	@ManyToOne(() => Session, (session) => session.paidStatuses, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'sessionId' })
	session!: Session;
}

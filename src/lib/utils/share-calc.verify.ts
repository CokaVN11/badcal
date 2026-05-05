import { computeShares, listPlayerOccurrences } from './share-calc.ts';
import type { CourtBlock, ExtraCost, Group } from '../types.ts';

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) {
		throw new Error(message);
	}
}

function assertEqual<T>(actual: T, expected: T, message: string) {
	if (actual !== expected) {
		throw new Error(`${message}: expected ${expected}, got ${actual}`);
	}
}

function assertClose(actual: number, expected: number, message: string) {
	if (Math.abs(actual - expected) > 1e-9) {
		throw new Error(`${message}: expected ${expected}, got ${actual}`);
	}
}

const groups: Group[] = [
	{
		id: 'g1',
		startTime: '09:00',
		endTime: '10:00',
		playerNames: ['Alex', 'Ben']
	},
	{
		id: 'g2',
		startTime: '10:00',
		endTime: '11:30',
		playerNames: ['Alex']
	}
];

const courtBlocks: CourtBlock[] = [
	{
		id: 'c1',
		courtCount: 1,
		startTime: '09:00',
		endTime: '11:30',
		pricePerHour: 120
	}
];

const extraCosts: ExtraCost[] = [{ label: 'Shuttlecocks', amount: 30 }];

const occurrences = listPlayerOccurrences(groups);
assertEqual(occurrences.length, 3, 'lists one occurrence per player entry');
assertEqual(occurrences[0]?.entryId, 'g1:0', 'builds first occurrence entry id');
assertEqual(occurrences[1]?.entryId, 'g1:1', 'builds second occurrence entry id');
assertEqual(occurrences[2]?.entryId, 'g2:0', 'builds duplicate-name occurrence entry id');
assertEqual(occurrences[0]?.name, occurrences[2]?.name, 'keeps duplicate display names');
assertEqual(occurrences[0]?.playerMinutes, 60, 'uses first group duration for first occurrence');
assertEqual(occurrences[2]?.playerMinutes, 90, 'uses second group duration for second occurrence');

const shares = computeShares(groups, courtBlocks, extraCosts);
assertEqual(shares.length, 3, 'returns one row per occurrence');
assert('courtShare' in shares[0], 'includes courtShare for consumers');
assert('extraShare' in shares[0], 'includes extraShare for consumers');
assertEqual(shares[0]?.entryId, 'g1:0', 'preserves source group order for first group rows');
assertEqual(shares[1]?.entryId, 'g1:1', 'preserves first group row set contiguously');
assertEqual(shares[2]?.entryId, 'g2:0', 'preserves source group order for later group rows');
assertClose(shares[0]?.ratio ?? 0, 60 / 210, 'computes first duplicate ratio from its own minutes');
assertClose(shares[2]?.ratio ?? 0, 90 / 210, 'computes second duplicate ratio from its own minutes');
assertClose(shares[0]?.extraShare ?? 0, 10, 'splits extras evenly across occurrences');
assertClose(shares[1]?.extraShare ?? 0, 10, 'splits extras evenly across occurrences for each row');
assertClose(shares[2]?.extraShare ?? 0, 10, 'splits extras evenly across later rows');
assertClose(shares[0]?.courtShare ?? 0, 300 * (60 / 210), 'computes court share from occurrence minutes');
assertClose(shares[2]?.courtShare ?? 0, 300 * (90 / 210), 'computes later occurrence court share from occurrence minutes');
assert((shares[0]?.total ?? 0) >= (shares[1]?.total ?? 0), 'keeps group rows in non-increasing total order');

const zeroCourtRows = computeShares(groups, [], []);
assertEqual(zeroCourtRows.length, 3, 'returns zero-total rows when court total is zero');
assertClose(zeroCourtRows[0]?.total ?? 0, 0, 'zero court total yields zero first row total without extras');
assertClose(zeroCourtRows[1]?.total ?? 0, 0, 'zero court total yields zero second row total without extras');
assertClose(zeroCourtRows[2]?.total ?? 0, 0, 'zero court total yields zero third row total without extras');

console.log('share-calc verification passed');

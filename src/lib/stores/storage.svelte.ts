// ABOUTME: Centralized reactive storage using Svelte 5 createSubscriber
// Type-safe, SSR-safe, cross-tab synced localStorage/sessionStorage wrapper

import { createReactiveStorage } from '$lib/utils/storage';
import { computeCourtTotal } from '$lib/utils/share-calc';
import type { CourtBlock, ExtraCost, Group, SavedLineup, SessionState } from '$lib/types';
import type { ProviderKey } from '$lib/utils/vietqr';
import { SvelteDate } from 'svelte/reactivity';

// ============================================================================
// Storage Instances
// ============================================================================

/**
 * App-wide settings (localStorage, prefix: 'badcal:')
 *
 * Usage:
 *   appStorage.billTheme            // reactive 'thermal' | 'zalopay'
 *   appStorage.onboardingComplete   // reactive boolean
 *   appStorage.reset()               // reset all to initial
 */
export const appStorage = createReactiveStorage(
	[
		['billTheme', { init: 'zalopay', storage: 'local' }],
		['onboardingComplete', { init: false, storage: 'local' }]
	],
	{ prefix: 'badcal:', storage: 'local' }
);

/**
 * Session data (localStorage, prefix: 'badcal:')
 * Mirrors the structure used in src/lib/stores/session.svelte.ts
 *
 * Usage:
 *   sessionStorage.session.sessionTitle    // reactive string
 *   sessionStorage.session.courtBlocks      // reactive CourtBlock[]
 *   sessionStorage.session.groups           // reactive Group[]
 *   sessionStorage.reset()                  // reset all
 */
// Cache helper — captured by onSet closure after sessionStorage is created
let _courtBlocksCacheKey = 0;
let _extraCostsCacheKey = 0;

export const sessionStorage = createReactiveStorage<SessionState>(
	[
		['title', { storage: 'session', init: 'New Session' }],
		['date', { init: new SvelteDate().toISOString().split('T')[0] }],
		['courtBlocks', { init: [] as CourtBlock[] }],
		['groups', { init: [] as Group[] }],
		['extraCosts', { init: [] as ExtraCost[] }],
		['_courtBlocksCacheKey', { init: 0 }],
		['_extraCostsCacheKey', { init: 0 }],
		['courtTotal', { init: null as number | null }],
		['extraTotal', { init: null as number | null }]
	],
	{
		prefix: 'badcal:session:',
		storage: 'local',
		onSet: (key, newValue) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const ss = sessionStorage as any;
			if (key === 'courtBlocks') {
				_courtBlocksCacheKey += 1;
				ss.courtTotal = computeCourtTotal((newValue as CourtBlock[]) ?? []);
				ss._courtBlocksCacheKey = _courtBlocksCacheKey;
			} else if (key === 'extraCosts') {
				_extraCostsCacheKey += 1;
				ss.extraTotal = ((newValue as ExtraCost[]) ?? []).reduce(
					(s, c) => s + (c.amount || 0),
					0
				);
				ss._extraCostsCacheKey = _extraCostsCacheKey;
			}
		}
	}
);

/**
 * Saved lineups (localStorage, prefix: 'badcal:')
 *
 * Usage:
 *   lineupsStorage.lineups         // reactive SavedLineup[]
 *   lineupsStorage.reset()          // reset to []
 */
export const lineupsStorage = createReactiveStorage(
	[['lineups', { init: [] as SavedLineup[], storage: 'local' }]],
	{ prefix: 'badcal:', storage: 'local' }
);

/**
 * Payment info (localStorage, prefix: 'badcal:')
 *
 * Usage:
 *   paymentStorage.paymentInfo?.accountNumber   // reactive string | null
 *   paymentStorage.paymentInfo?.providerKey      // reactive ProviderKey | null
 *   paymentStorage.reset()                       // clear payment info
 */
export const paymentStorage = createReactiveStorage(
	[
		[
			'paymentInfo',
			{
				init: null as {
					providerKey: ProviderKey;
					accountNumber: string;
					accountName?: string;
				} | null,
				storage: 'local'
			}
		]
	],
	{ prefix: 'badcal:', storage: 'local' }
);

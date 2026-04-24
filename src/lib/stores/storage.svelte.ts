// ABOUTME: Centralized reactive storage using Svelte 5 createSubscriber
// Type-safe, SSR-safe, cross-tab synced localStorage/sessionStorage wrapper

import { createReactiveStorage } from '$lib/utils/storage';
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
export const sessionStorage = createReactiveStorage<SessionState>(
	[
		['title', { storage: 'session', init: 'New Session' }],
		['date', { init: new SvelteDate().toISOString().split('T')[0] }],
		['courtBlocks', { init: [] as CourtBlock[] }],
		['groups', { init: [] as Group[] }],
		['extraCosts', { init: [] as ExtraCost[] }]
	],
	{ prefix: 'badcal:session:', storage: 'local' }
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

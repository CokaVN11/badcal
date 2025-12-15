// ABOUTME: Formatting utilities for currency, numbers, and dates
// ABOUTME: Vietnamese locale formatting with shorthand support (14k, 1.5tr)

import { m } from '$lib/paraglide/messages';

/**
 * Parse Vietnamese number shorthand to numeric value
 * Supports: k/K (nghìn/thousand), tr/m/M (triệu/million)
 * Also handles decimal comma (1,5 → 1.5)
 *
 * @example
 * parseVietnameseNumber("14k")   // 14000
 * parseVietnameseNumber("1.5k")  // 1500
 * parseVietnameseNumber("1,5k")  // 1500 (decimal comma)
 * parseVietnameseNumber("2tr")   // 2000000
 * parseVietnameseNumber("100")   // 100
 * parseVietnameseNumber("")      // 0
 */
export function parseVietnameseNumber(input: string): number {
	if (!input || typeof input !== 'string') return 0;

	// Trim and normalize
	let str = input.trim().toLowerCase();

	// Handle empty string
	if (str === '') return 0;

	// Replace decimal comma with decimal point (Vietnamese style)
	str = str.replace(',', '.');

	// Remove spaces and dots used as thousand separators (e.g., "14.000" or "14 000")
	// But preserve decimal point if followed by digits and then a suffix
	// Pattern: if there's a suffix, dots before it are thousand separators
	const hasSuffix = /[kmtr]+$/i.test(str);
	if (hasSuffix) {
		// Remove thousand separator dots (but keep decimal dots)
		// "14.000k" should become "14000k" → but "1.5k" should stay "1.5k"
		// Heuristic: dot followed by exactly 3 digits is a thousand separator
		str = str.replace(/\.(\d{3})/g, '$1');
	}

	// Extract multiplier suffix
	let multiplier = 1;
	if (str.endsWith('tr')) {
		multiplier = 1_000_000;
		str = str.slice(0, -2);
	} else if (str.endsWith('m')) {
		multiplier = 1_000_000;
		str = str.slice(0, -1);
	} else if (str.endsWith('k')) {
		multiplier = 1_000;
		str = str.slice(0, -1);
	}

	// Parse the numeric part
	const num = parseFloat(str);
	if (isNaN(num)) return 0;

	return Math.round(num * multiplier);
}

/**
 * Format a number to compact Vietnamese style for display
 * @example
 * formatCompactNumber(14000)    // "14k"
 * formatCompactNumber(1500)     // "1.5k"
 * formatCompactNumber(2000000)  // "2tr"
 * formatCompactNumber(100)      // "100"
 */
export function formatCompactNumber(value: number): string {
	if (value === 0) return '0';

	if (value >= 1_000_000) {
		const millions = value / 1_000_000;
		return millions % 1 === 0 ? `${millions}tr` : `${millions.toFixed(1).replace(/\.0$/, '')}tr`;
	}

	if (value >= 1_000) {
		const thousands = value / 1_000;
		return thousands % 1 === 0 ? `${thousands}k` : `${thousands.toFixed(1).replace(/\.0$/, '')}k`;
	}

	return String(value);
}

export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat('vi-VN').format(amount) + m.currency();
}

export function formatInputDisplay(value: number, rawInput?: string): string {
	if (rawInput !== undefined && rawInput !== '') return rawInput;
	if (value === 0) return '';
	return formatCompactNumber(value);
}

export function formatDate(dateStr: string): string {
	const date = new Date(dateStr);
	return date.toLocaleDateString('vi-VN', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});
}

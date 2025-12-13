// ABOUTME: Formatting utilities for currency and dates
// ABOUTME: Vietnamese locale formatting for the badminton app

import { m } from '$lib/paraglide/messages';

export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat('vi-VN').format(amount) + m.currency();
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

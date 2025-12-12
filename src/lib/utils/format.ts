// ABOUTME: Formatting utilities for currency and dates
// ABOUTME: Vietnamese locale formatting for the badminton app

export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
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

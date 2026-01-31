// ABOUTME: Bill sharing utilities - image generation, native share, download
// Extracted from BillPreview.svelte for better separation of concerns

export type BillTheme = 'thermal' | 'zalopay';

/**
 * Wait for web fonts to finish loading before capturing image
 * Ensures text renders correctly in exported images
 */
export async function waitForFonts(): Promise<void> {
	if ('fonts' in document) {
		try {
			await document.fonts.ready;
		} catch {
			/* ignore - fonts API may not be available */
		}
	}
}

/**
 * Generate PNG blob from DOM element using html-to-image
 * Handles animation cleanup and theme-specific backgrounds
 *
 * @param element - DOM element to capture
 * @param theme - Current bill theme (affects background color)
 * @returns Promise<Blob> - PNG image blob
 * @throws Error if image generation fails
 */
export async function generateImageBlob(
	element: HTMLElement,
	theme: BillTheme
): Promise<Blob> {
	const { toPng } = await import('html-to-image');

	// Remove animation during capture for clean screenshot
	const hadAnimation = element.classList.contains('animate-pop-in');
	if (hadAnimation) element.classList.remove('animate-pop-in');

	// Theme-specific background
	const bgColor = theme === 'zalopay' ? '#f1f5f9' : 'transparent';

	try {
		const dataUrl = await toPng(element, {
			cacheBust: true,
			pixelRatio: 2,
			backgroundColor: bgColor,
			skipFonts: false,
			includeQueryParams: true,
			filter: (node) => {
				if (node instanceof Element) {
					const tagName = node.tagName?.toLowerCase();
					if (tagName === 'script' || tagName === 'noscript') return false;
				}
				return true;
			}
		});

		const res = await fetch(dataUrl);
		const blob = await res.blob();
		if (!blob || blob.size === 0) throw new Error('Failed to generate image');
		return blob;
	} finally {
		// Restore animation if it was present
		if (hadAnimation) element.classList.add('animate-pop-in');
	}
}

/**
 * Attempt native Web Share API for image sharing
 * Falls back to false if navigator.share unavailable or unsupported
 *
 * @param file - File to share
 * @param title - Share title
 * @param text - Share text description
 * @returns Promise<boolean> - true if shared successfully, false otherwise
 */
export async function tryNativeShare(
	file: File,
	title: string,
	text: string
): Promise<boolean> {
	if (!navigator.share) return false;

	const shareData: ShareData = {
		title,
		text,
		files: [file]
	};

	if (navigator.canShare && !navigator.canShare(shareData)) return false;

	try {
		await navigator.share(shareData);
		return true;
	} catch {
		return false;
	}
}

/**
 * Trigger browser download for a blob
 * Creates temporary anchor element and revokes URL after download
 *
 * @param blob - Blob to download
 * @param filename - Desired filename
 */
export function downloadBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

/**
 * Build safe image filename from session title and date
 * Sanitizes special characters, limits length, uses ISO date format
 *
 * @param title - Session title
 * @param date - Session date (ISO string or similar)
 * @returns Safe filename in format: badcal-YYYY-MM-DD-title.png
 */
export function buildImageFilename(title: string, date: string): string {
	const safeTitle = title
		.trim()
		.replace(/\s+/g, '-')
		.replace(/[^\p{L}\p{N}-]/gu, '')
		.slice(0, 48);
	const safeDate = date?.trim() || new Date().toISOString().split('T')[0];
	return `badcal-${safeDate}${safeTitle ? `-${safeTitle}` : ''}.png`;
}

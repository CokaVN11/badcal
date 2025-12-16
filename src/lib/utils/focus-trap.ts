// ABOUTME: Focus trap utility for modals and dialogs
// ABOUTME: Traps keyboard focus within a container for accessibility

const FOCUSABLE_SELECTORS =
	'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Traps focus within a container element.
 * Returns a cleanup function to remove the event listener.
 */
export function trapFocus(container: HTMLElement): () => void {
	const focusableElements = container.querySelectorAll(FOCUSABLE_SELECTORS);
	const firstFocusable = focusableElements[0] as HTMLElement | undefined;
	const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement | undefined;

	function handleKeydown(e: KeyboardEvent) {
		if (e.key !== 'Tab') return;

		// If no focusable elements, prevent tab
		if (!firstFocusable || !lastFocusable) {
			e.preventDefault();
			return;
		}

		// Shift + Tab: if on first element, go to last
		if (e.shiftKey && document.activeElement === firstFocusable) {
			e.preventDefault();
			lastFocusable.focus();
		}
		// Tab: if on last element, go to first
		else if (!e.shiftKey && document.activeElement === lastFocusable) {
			e.preventDefault();
			firstFocusable.focus();
		}
	}

	container.addEventListener('keydown', handleKeydown);

	// Focus the first focusable element
	firstFocusable?.focus();

	// Return cleanup function
	return () => container.removeEventListener('keydown', handleKeydown);
}

/**
 * Creates a focus trap that can be activated/deactivated.
 */
export function createFocusTrap(container: HTMLElement) {
	let cleanup: (() => void) | null = null;
	let previousActiveElement: HTMLElement | null = null;

	return {
		activate() {
			previousActiveElement = document.activeElement as HTMLElement;
			cleanup = trapFocus(container);
		},
		deactivate() {
			cleanup?.();
			cleanup = null;
			previousActiveElement?.focus();
		}
	};
}

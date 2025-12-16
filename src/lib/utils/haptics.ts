// ABOUTME: Haptic feedback utility for mobile devices
// ABOUTME: Uses Vibration API with fallback for unsupported devices

type HapticIntensity = 'light' | 'medium' | 'heavy';

const PATTERNS: Record<HapticIntensity, number> = {
	light: 10,
	medium: 25,
	heavy: 50
};

export function triggerHaptic(intensity: HapticIntensity = 'light'): void {
	if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
		try {
			navigator.vibrate(PATTERNS[intensity]);
		} catch {
			// Silent fail - some browsers block vibration
		}
	}
}

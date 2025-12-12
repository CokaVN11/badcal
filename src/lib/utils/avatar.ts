// ABOUTME: Avatar utilities for player display
// ABOUTME: Color cycling and initial extraction

export const AVATAR_COLORS = [
	'avatar-green',
	'avatar-yellow',
	'avatar-blue',
	'avatar-red',
	'avatar-purple',
	'avatar-pink'
] as const;

export function getAvatarColor(index: number): string {
	return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

export function getInitial(name: string): string {
	return name ? name.charAt(0).toUpperCase() : '?';
}

export type Player = {
	id: number;
	name: string;
	hours: number;
	arrivalOffsetMinutes: number;
	ratio?: number;
	share?: number;
};

export type ExtraCost = {
	id?: string;
	label: string;
	amount: number;
};

export type SessionState = {
	title: string;
	date: string;
	courtBlocks: CourtBlock[];
	groups: Group[];
	extraCosts: ExtraCost[];
};

export type SavedLineup = {
	id: string;
	name: string;
	playerNames: string[];
	createdAt: number;
	updatedAt: number;
};

// Block of court in the same time slot.
export type CourtBlock = {
	id: string;
	courtCount: number;
	startTime: string; // "HH:mm" format
	endTime: string; // "HH:mm" format
	pricePerHour: number;
};

// Group of players playing in the same time slot, could be different court blocks.
export type Group = {
	id: string;
	startTime: string; // "HH:mm" format
	endTime: string; // "HH:mm" format
	playerNames: string[];
};

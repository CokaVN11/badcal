// ABOUTME: Shared type definitions for the badminton cost splitter app
// ABOUTME: Central location for Player, Cost, and Session types

export type Player = {
	id: number;
	name: string;
	hours: number;
	ratio?: number;
	share?: number;
};

export type AdditionalCost = {
	id: number;
	label: string;
	amount: number;
};

export type Session = {
	title: string;
	date: string;
	courtHours: number;
	courtPrice: number;
	shuttlecockPrice: number;
	shuttlecockCount: number;
};

export type PlayerShare = Player & {
	ratio: number;
	share: number;
};

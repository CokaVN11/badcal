export type Player = {
	id: number;
	name: string;
	hours: number;
  arrivalOffsetMinutes: number;
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
  startTime: string | null; // "HH:mm" format or null for all-day
	courtHours: number;
	courtPrice: number;
	shuttlecockPrice: number;
	shuttlecockCount: number;
};

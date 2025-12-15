// ABOUTME: VietQR utility for generating Vietnamese bank transfer QR codes
// ABOUTME: Supports major Vietnamese banks via VietQR EMVCo standard

import { QRPay, BanksObject } from 'vietnam-qr-pay';
import QRCode from 'qrcode';

export type ProviderType = 'bank' | 'ewallet';

export type PaymentProvider = {
	key: string;
	name: string;
	bin: string;
	type: ProviderType;
	accountPrefix?: string;
	icon?: string;
};

export const PAYMENT_PROVIDERS: PaymentProvider[] = [
	{ key: 'VIETCOMBANK', name: 'Vietcombank', bin: BanksObject.vietcombank.bin, type: 'bank' },
	{ key: 'TECHCOMBANK', name: 'Techcombank', bin: BanksObject.techcombank.bin, type: 'bank' },
	{ key: 'MBBANK', name: 'MB Bank', bin: BanksObject.mbbank.bin, type: 'bank' },
	{ key: 'VPBANK', name: 'VPBank', bin: BanksObject.vpbank.bin, type: 'bank' },
	{ key: 'ACB', name: 'ACB', bin: BanksObject.acb.bin, type: 'bank' },
	{ key: 'TPBANK', name: 'TPBank', bin: BanksObject.tpbank.bin, type: 'bank' },
	{ key: 'VIETINBANK', name: 'VietinBank', bin: BanksObject.vietinbank.bin, type: 'bank' },
	{ key: 'BIDV', name: 'BIDV', bin: BanksObject.bidv.bin, type: 'bank' },
	{ key: 'AGRIBANK', name: 'Agribank', bin: BanksObject.agribank.bin, type: 'bank' },
	{ key: 'SACOMBANK', name: 'Sacombank', bin: BanksObject.sacombank.bin, type: 'bank' },
	{ key: 'VIB', name: 'VIB', bin: BanksObject.vib.bin, type: 'bank' },
	{ key: 'SHB', name: 'SHB', bin: BanksObject.shb.bin, type: 'bank' },
	{ key: 'HDBANK', name: 'HDBank', bin: BanksObject.hdbank.bin, type: 'bank' },
	{ key: 'OCB', name: 'OCB', bin: BanksObject.ocb.bin, type: 'bank' },
	{ key: 'MSB', name: 'MSB', bin: BanksObject.msb.bin, type: 'bank' },
	{ key: 'SEABANK', name: 'SeABank', bin: BanksObject.seabank.bin, type: 'bank' },
	{ key: 'EXIMBANK', name: 'Eximbank', bin: BanksObject.eximbank.bin, type: 'bank' }
];

export const BANKS = PAYMENT_PROVIDERS;

export type ProviderKey = (typeof PAYMENT_PROVIDERS)[number]['key'];

export type PaymentInfo = {
	providerKey: ProviderKey;
	accountNumber: string;
	accountName?: string;
};

export type QRGenerationResult =
	| {
			success: true;
			dataUrl: string;
			rawData: string;
	  }
	| {
			success: false;
			error: string;
	  };

export function getProvider(providerKey: string): PaymentProvider | undefined {
	return PAYMENT_PROVIDERS.find((p) => p.key === providerKey);
}

export function getProviderName(providerKey: string): string {
	const provider = getProvider(providerKey);
	if (!provider) return providerKey;
	return provider.icon ? `${provider.icon} ${provider.name}` : provider.name;
}

export function getProviderDisplayName(providerKey: string): string {
	return getProvider(providerKey)?.name ?? providerKey;
}

export function generateVietQRData(payment: PaymentInfo): string {
	const provider = getProvider(payment.providerKey);
	if (!provider) {
		throw new Error(`Unknown provider: ${payment.providerKey}`);
	}

	const qrPay = QRPay.initVietQR({
		bankBin: provider.bin,
		bankNumber: payment.accountNumber
	});

	return qrPay.build();
}

export async function generateVietQRImage(
	payment: PaymentInfo,
	options?: {
		width?: number;
		margin?: number;
		errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
	}
): Promise<QRGenerationResult> {
	try {
		const rawData = generateVietQRData(payment);

		const dataUrl = await QRCode.toDataURL(rawData, {
			width: options?.width ?? 256,
			margin: options?.margin ?? 1,
			errorCorrectionLevel: options?.errorCorrectionLevel ?? 'M',
			color: {
				dark: '#2d2a26',
				light: '#FFFFFF'
			}
		});

		return { success: true, dataUrl, rawData };
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to generate QR code';
		return { success: false, error: message };
	}
}

export function isValidAccountNumber(accountNumber: string, providerKey?: string): boolean {
	const cleaned = accountNumber.replace(/\s/g, '');

	if (providerKey) {
		const provider = getProvider(providerKey);
		if (provider?.type === 'ewallet') {
			return /^[\dA-Z]{10,20}$/.test(cleaned);
		}
	}

	return /^\d{6,19}$/.test(cleaned);
}

const STORAGE_KEY = 'badcal_payment_info';

export type SavedPaymentInfo = {
	providerKey: ProviderKey;
	accountNumber: string;
	accountName?: string;
};

export function savePaymentInfo(info: SavedPaymentInfo): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
}

export function loadPaymentInfo(): SavedPaymentInfo | null {
	if (typeof localStorage === 'undefined') return null;
	const saved = localStorage.getItem(STORAGE_KEY);
	if (!saved) return null;

	try {
		const parsed = JSON.parse(saved);
		if (parsed.bankKey) {
			return {
				providerKey: parsed.bankKey,
				accountNumber: parsed.accountNumber,
				accountName: parsed.accountName
			};
		}
		return parsed;
	} catch {
		return null;
	}
}

export function clearPaymentInfo(): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.removeItem(STORAGE_KEY);
}

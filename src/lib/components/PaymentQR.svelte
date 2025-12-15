<script lang="ts">
	// ABOUTME: VietQR payment QR code display with bank account configuration
	// ABOUTME: Generates static QR codes (no amount) matching thermal receipt theme

	import { m } from '$lib/paraglide/messages.js';
	import { onMount } from 'svelte';
	import {
		BANKS,
		generateVietQRImage,
		savePaymentInfo,
		loadPaymentInfo,
		isValidAccountNumber,
		getProviderDisplayName,
		type ProviderKey,
		type PaymentInfo
	} from '$lib/utils/vietqr';
	import { IconQrcode, IconChevronDown, IconCheck, IconX } from '@tabler/icons-svelte-runes';

	let isConfiguring = $state(false);
	let selectedProvider = $state<ProviderKey | ''>('');
	let accountNumber = $state('');
	let accountName = $state('');
	let qrDataUrl = $state<string | null>(null);
	let qrError = $state<string | null>(null);
	let isGenerating = $state(false);

	let isValidConfig = $derived(
		selectedProvider !== '' &&
			accountNumber.trim() !== '' &&
			isValidAccountNumber(accountNumber, selectedProvider)
	);

	let hasConfig = $derived(selectedProvider !== '' && accountNumber !== '');

	onMount(async () => {
		const saved = loadPaymentInfo();
		if (saved) {
			selectedProvider = saved.providerKey;
			accountNumber = saved.accountNumber;
			accountName = saved.accountName ?? '';
			await doGenerateQR();
		}
	});

	async function doGenerateQR() {
		if (!isValidConfig || selectedProvider === '' || isGenerating) return;

		isGenerating = true;
		qrError = null;

		const payment: PaymentInfo = {
			providerKey: selectedProvider,
			accountNumber: accountNumber.trim(),
			accountName: accountName.trim() || undefined
		};

		const result = await generateVietQRImage(payment, { width: 200, margin: 1 });

		if (result.success) {
			qrDataUrl = result.dataUrl;
			savePaymentInfo({
				providerKey: selectedProvider,
				accountNumber: accountNumber.trim(),
				accountName: accountName.trim() || undefined
			});
			isConfiguring = false;
		} else {
			qrError = result.error;
		}

		isGenerating = false;
	}

	function handleGenerateClick() {
		doGenerateQR();
	}

	function startConfiguring() {
		isConfiguring = true;
		qrDataUrl = null;
	}

	function cancelConfiguring() {
		isConfiguring = false;
		const saved = loadPaymentInfo();
		if (saved) {
			selectedProvider = saved.providerKey;
			accountNumber = saved.accountNumber;
			accountName = saved.accountName ?? '';
		}
	}
</script>

<div class="qr-section">
	{#if isConfiguring}
		<div class="qr-heading">{m.qr_setup_title().toUpperCase()}</div>

		<div class="qr-form">
			<div class="form-row">
				<span class="form-label">{m.qr_bank_label()}</span>
				<div class="form-input-wrapper">
					<select bind:value={selectedProvider} class="form-select">
						<option value="">{m.qr_select_bank()}</option>
						{#each BANKS as provider (provider.key)}
							<option value={provider.key}>{provider.name}</option>
						{/each}
					</select>
					<IconChevronDown class="select-chevron" />
				</div>
			</div>

			<div class="form-row">
				<span class="form-label">{m.qr_account_number()}</span>
				<input
					type="text"
					inputmode="numeric"
					bind:value={accountNumber}
					placeholder={m.qr_account_placeholder()}
					class="form-input mono"
				/>
			</div>

			<div class="form-row">
				<span class="form-label">{m.qr_account_name()}</span>
				<input
					type="text"
					bind:value={accountName}
					placeholder={m.qr_name_placeholder()}
					class="form-input"
				/>
			</div>

			{#if qrError}
				<div class="qr-error">{qrError}</div>
			{/if}

			<div class="form-actions">
				{#if hasConfig}
					<button type="button" class="btn-thermal" onclick={cancelConfiguring}>
						<IconX class="btn-icon" />
						{m.cancel()}
					</button>
				{/if}
				<button
					type="button"
					class="btn-thermal primary"
					onclick={handleGenerateClick}
					disabled={!isValidConfig || isGenerating}
				>
					{#if isGenerating}
						<span class="spinner"></span>
					{:else}
						<IconCheck class="btn-icon" />
					{/if}
					{m.qr_generate()}
				</button>
			</div>
		</div>
	{:else if qrDataUrl && hasConfig}
		<div class="qr-heading">SCAN TO PAY</div>

		<div class="qr-display">
			<div class="qr-code-frame">
				<img src={qrDataUrl} alt="VietQR Payment Code" class="qr-code-img" />
			</div>

			<div class="qr-account-info">
				<div class="account-provider">{getProviderDisplayName(selectedProvider)}</div>
				<div class="account-number">{accountNumber}</div>
				{#if accountName}
					<div class="account-name">{accountName}</div>
				{/if}
			</div>

			<button type="button" class="qr-change-btn" onclick={startConfiguring}>
				[{m.qr_change_account()}]
			</button>
		</div>
	{:else}
		<button type="button" class="qr-setup-btn" onclick={startConfiguring}>
			<IconQrcode class="qr-setup-icon" />
			<span class="qr-setup-text">{m.qr_setup_prompt()}</span>
			<span class="qr-setup-hint">{m.qr_setup_hint()}</span>
		</button>
	{/if}
</div>

<style>
	.qr-section {
		margin-top: 8px;
	}

	.qr-heading {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.1em;
		color: #6b6560;
		margin-bottom: 6px;
		text-align: center;
	}

	.qr-setup-btn {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding: 10px;
		background: transparent;
		border: 1px dashed #a8a39d;
		cursor: pointer;
		transition: all 0.2s;
		color: #6b6560;
	}

	.qr-setup-btn:hover {
		border-color: #6b6560;
		background: rgba(0, 0, 0, 0.02);
	}

	:global(.qr-setup-icon) {
		width: 20px;
		height: 20px;
		opacity: 0.6;
	}

	.qr-setup-text {
		font-size: 12px;
		font-weight: 600;
		color: #4a4640;
	}

	.qr-setup-hint {
		font-size: 10px;
		color: #8b8680;
	}

	.qr-form {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.form-row {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.form-label {
		font-size: 10px;
		font-weight: 600;
		color: #6b6560;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.form-input-wrapper {
		position: relative;
	}

	.form-select,
	.form-input {
		width: 100%;
		padding: 6px 8px;
		font-size: 12px;
		border: 1px solid #c4c0ba;
		background: #fdfcf8;
		color: #2d2a26;
	}

	.form-select {
		padding-right: 28px;
		appearance: none;
		cursor: pointer;
	}

	.form-input.mono {
		font-family: 'JetBrains Mono', 'Courier New', monospace;
		letter-spacing: 0.03em;
	}

	.form-select:focus,
	.form-input:focus {
		outline: none;
		border-color: #4a4640;
	}

	:global(.select-chevron) {
		position: absolute;
		right: 6px;
		top: 50%;
		transform: translateY(-50%);
		width: 14px;
		height: 14px;
		color: #6b6560;
		pointer-events: none;
	}

	.qr-error {
		font-size: 11px;
		color: #b91c1c;
		text-align: center;
		padding: 4px;
		background: #fef2f2;
		border: 1px solid #fecaca;
	}

	.form-actions {
		display: flex;
		gap: 8px;
		margin-top: 4px;
	}

	.btn-thermal {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		padding: 8px 12px;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		background: #e5e4e0;
		color: #4a4640;
		border: 1px solid #c4c0ba;
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn-thermal:hover {
		background: #d5d4d0;
	}

	.btn-thermal.primary {
		background: #4a4640;
		color: #f9f7f1;
		border-color: #4a4640;
	}

	.btn-thermal.primary:hover:not(:disabled) {
		background: #3a3630;
	}

	.btn-thermal:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	:global(.btn-icon) {
		width: 14px;
		height: 14px;
	}

	.spinner {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: currentColor;
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.qr-display {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}

	.qr-code-frame {
		background: white;
		padding: 4px;
		border: 1px solid #c4c0ba;
	}

	.qr-code-img {
		display: block;
		width: 100px;
		height: 100px;
		image-rendering: pixelated;
	}

	.qr-account-info {
		text-align: center;
		font-family: 'JetBrains Mono', 'Courier New', monospace;
	}

	.account-provider {
		font-size: 11px;
		font-weight: 600;
		color: #4a4640;
	}

	.account-number {
		font-size: 12px;
		color: #2d2a26;
		letter-spacing: 0.03em;
	}

	.account-name {
		font-size: 10px;
		color: #6b6560;
		text-transform: uppercase;
	}

	.qr-change-btn {
		font-size: 10px;
		font-family: 'JetBrains Mono', 'Courier New', monospace;
		color: #8b8680;
		background: none;
		border: none;
		cursor: pointer;
		padding: 2px 4px;
	}

	.qr-change-btn:hover {
		color: #4a4640;
	}
</style>

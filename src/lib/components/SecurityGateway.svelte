<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { ShieldCheck, AlertCircle, Loader2, Lock, Mail, User, Terminal } from 'lucide-svelte';
	import { fade, fly } from 'svelte/transition';

	let activeTab = $state<'signin' | 'register'>('signin');

	// Sign In fields
	let signInEmail = $state('');
	let signInPassword = $state('');

	// Register fields
	let regUsername = $state('');
	let regEmail = $state('');
	let regPassword = $state('');
	let regConfirmPassword = $state('');

	let isSubmitting = $state(false);

	async function handleSignIn(e: Event) {
		e.preventDefault();
		if (isSubmitting) return;
		isSubmitting = true;
		await authStore.signIn(signInEmail, signInPassword);
		isSubmitting = false;
	}

	async function handleRegister(e: Event) {
		e.preventDefault();
		if (isSubmitting) return;
		isSubmitting = true;
		await authStore.register(regUsername, regEmail, regPassword, regConfirmPassword);
		isSubmitting = false;
	}

	function switchTab(tab: 'signin' | 'register') {
		activeTab = tab;
	}
</script>

<div class="fixed inset-0 bg-surface flex items-center justify-center p-6 z-50">
	<!-- Background Effects -->
	<div class="absolute inset-0 overflow-hidden pointer-events-none">
		<div class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 blur-[100px] rounded-full"></div>
		<div
			class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 blur-[100px] rounded-full"
		></div>
		<div
			class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-primary/5 opacity-30"
		></div>
		<div
			class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-primary/3 opacity-20"
		></div>
		<!-- Grid overlay -->
		<div
			class="absolute inset-0 opacity-[0.02]"
			style="background-image: radial-gradient(circle at 2px 2px, rgba(0,255,255,0.3) 1px, transparent 0); background-size: 40px 40px;"
		></div>
	</div>

	<div class="w-full max-w-md relative">
		<!-- Decorative Element -->
		<div class="absolute -top-16 -left-16 text-primary/5">
			<Terminal size={160} strokeWidth={0.4} />
		</div>

		<div class="glass-heavy p-0 border-primary/20 relative overflow-hidden">
			<!-- Scanning Line Animation -->
			<div
				class="absolute top-0 left-0 right-0 h-[1px] bg-primary/30 shadow-[0_0_10px_rgba(0,255,255,0.5)] animate-[scan_4s_linear_infinite]"
			></div>

			<!-- Header Section -->
			<div class="px-10 pt-10 pb-6">
				<div class="flex items-center gap-3 mb-2">
					<div class="p-2 bg-primary/10 rounded border border-primary/20">
						<ShieldCheck class="text-primary" size={22} />
					</div>
					<div>
						<h1
							class="text-lg font-headline font-bold text-white tracking-[0.15em] uppercase leading-tight"
						>
							ARENA.OPS
						</h1>
						<p class="text-[9px] font-label text-primary/60 tracking-[0.25em] uppercase">
							Security Access Gateway
						</p>
					</div>
				</div>
			</div>

			<!-- Tab Toggle -->
			<div class="flex border-b border-white/5 relative">
				<button
					onclick={() => switchTab('signin')}
					class="flex-1 py-4 text-center text-[10px] font-label font-bold tracking-[0.3em] uppercase transition-all relative
					{activeTab === 'signin'
						? 'text-primary'
						: 'text-white/30 hover:text-white/60'}"
				>
					SIGN IN
					{#if activeTab === 'signin'}
						<div
							class="absolute bottom-0 left-0 right-0 h-[2px] bg-primary shadow-[0_0_10px_rgba(0,255,255,0.8)]"
							in:fade={{ duration: 200 }}
						></div>
					{/if}
				</button>
				<button
					onclick={() => switchTab('register')}
					class="flex-1 py-4 text-center text-[10px] font-label font-bold tracking-[0.3em] uppercase transition-all relative
					{activeTab === 'register'
						? 'text-primary'
						: 'text-white/30 hover:text-white/60'}"
				>
					CREATE ACCOUNT
					{#if activeTab === 'register'}
						<div
							class="absolute bottom-0 left-0 right-0 h-[2px] bg-primary shadow-[0_0_10px_rgba(0,255,255,0.8)]"
							in:fade={{ duration: 200 }}
						></div>
					{/if}
				</button>
			</div>

			<!-- Form Section -->
			<div class="px-10 py-8">
				{#if activeTab === 'signin'}
					<form onsubmit={handleSignIn} class="space-y-5" in:fade={{ duration: 250 }}>
						<!-- Email -->
						<div>
							<label
								for="signin-email"
								class="flex items-center gap-2 text-[10px] font-label font-bold text-primary/80 tracking-[0.2em] uppercase mb-2 ml-1"
							>
								<Mail size={12} />
								Email Address
							</label>
							<div class="relative group">
								<input
									type="email"
									id="signin-email"
									bind:value={signInEmail}
									placeholder="OPERATIVE@ARENA.OPS"
									required
									class="w-full bg-white/[0.02] border border-white/10 rounded-sm px-4 py-3.5 text-sm text-white font-label tracking-wider focus:outline-none focus:border-primary/50 focus:bg-white/5 transition-all placeholder:text-white/10"
								/>
								<div
									class="absolute bottom-0 left-0 right-0 h-[2px] bg-primary scale-x-0 group-focus-within:scale-x-100 transition-transform origin-left"
								></div>
							</div>
						</div>

						<!-- Password -->
						<div>
							<label
								for="signin-password"
								class="flex items-center gap-2 text-[10px] font-label font-bold text-primary/80 tracking-[0.2em] uppercase mb-2 ml-1"
							>
								<Lock size={12} />
								Password
							</label>
							<div class="relative group">
								<input
									type="password"
									id="signin-password"
									bind:value={signInPassword}
									placeholder="••••••••"
									required
									class="w-full bg-white/[0.02] border border-white/10 rounded-sm px-4 py-3.5 text-sm text-white font-label tracking-wider focus:outline-none focus:border-primary/50 focus:bg-white/5 transition-all placeholder:text-white/10"
								/>
								<div
									class="absolute bottom-0 left-0 right-0 h-[2px] bg-primary scale-x-0 group-focus-within:scale-x-100 transition-transform origin-left"
								></div>
							</div>
						</div>

						<!-- Error -->
						{#if authStore.error}
							<div
								class="flex items-start gap-3 p-4 bg-secondary/10 border border-secondary/30 rounded-sm shadow-[0_0_15px_rgba(255,61,0,0.1)]"
								in:fly={{ y: -8, duration: 300 }}
							>
								<AlertCircle class="text-secondary flex-shrink-0 mt-0.5" size={16} />
								<p
									class="text-[11px] text-secondary font-label font-bold tracking-wider uppercase leading-relaxed"
								>
									{authStore.error}
								</p>
							</div>
						{/if}

						<button
							type="submit"
							disabled={isSubmitting || !signInEmail.trim() || !signInPassword}
							class="w-full py-4 bg-primary text-surface font-headline font-bold tracking-[0.3em] uppercase relative overflow-hidden hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:scale-100 shadow-[0_0_20px_rgba(0,255,255,0.2)] mt-2"
						>
							{#if isSubmitting}
								<div class="flex items-center justify-center gap-2">
									<Loader2 size={18} class="animate-spin" />
									<span>AUTHENTICATING...</span>
								</div>
							{:else}
								INITIALIZE LINK
							{/if}
						</button>
					</form>
				{:else}
					<form onsubmit={handleRegister} class="space-y-5" in:fade={{ duration: 250 }}>
						<!-- Username -->
						<div>
							<label
								for="reg-username"
								class="flex items-center gap-2 text-[10px] font-label font-bold text-primary/80 tracking-[0.2em] uppercase mb-2 ml-1"
							>
								<User size={12} />
								Operative Callsign
							</label>
							<div class="relative group">
								<input
									type="text"
									id="reg-username"
									bind:value={regUsername}
									placeholder="ENTER CALLSIGN..."
									required
									class="w-full bg-white/[0.02] border border-white/10 rounded-sm px-4 py-3.5 text-sm text-white font-label tracking-wider focus:outline-none focus:border-primary/50 focus:bg-white/5 transition-all placeholder:text-white/10"
								/>
								<div
									class="absolute bottom-0 left-0 right-0 h-[2px] bg-primary scale-x-0 group-focus-within:scale-x-100 transition-transform origin-left"
								></div>
							</div>
						</div>

						<!-- Email -->
						<div>
							<label
								for="reg-email"
								class="flex items-center gap-2 text-[10px] font-label font-bold text-primary/80 tracking-[0.2em] uppercase mb-2 ml-1"
							>
								<Mail size={12} />
								Email Address
							</label>
							<div class="relative group">
								<input
									type="email"
									id="reg-email"
									bind:value={regEmail}
									placeholder="OPERATIVE@ARENA.OPS"
									required
									class="w-full bg-white/[0.02] border border-white/10 rounded-sm px-4 py-3.5 text-sm text-white font-label tracking-wider focus:outline-none focus:border-primary/50 focus:bg-white/5 transition-all placeholder:text-white/10"
								/>
								<div
									class="absolute bottom-0 left-0 right-0 h-[2px] bg-primary scale-x-0 group-focus-within:scale-x-100 transition-transform origin-left"
								></div>
							</div>
						</div>

						<!-- Password -->
						<div>
							<label
								for="reg-password"
								class="flex items-center gap-2 text-[10px] font-label font-bold text-primary/80 tracking-[0.2em] uppercase mb-2 ml-1"
							>
								<Lock size={12} />
								Password
							</label>
							<div class="relative group">
								<input
									type="password"
									id="reg-password"
									bind:value={regPassword}
									placeholder="••••••••"
									required
									class="w-full bg-white/[0.02] border border-white/10 rounded-sm px-4 py-3.5 text-sm text-white font-label tracking-wider focus:outline-none focus:border-primary/50 focus:bg-white/5 transition-all placeholder:text-white/10"
								/>
								<div
									class="absolute bottom-0 left-0 right-0 h-[2px] bg-primary scale-x-0 group-focus-within:scale-x-100 transition-transform origin-left"
								></div>
							</div>
						</div>

						<!-- Confirm Password -->
						<div>
							<label
								for="reg-confirm-password"
								class="flex items-center gap-2 text-[10px] font-label font-bold text-primary/80 tracking-[0.2em] uppercase mb-2 ml-1"
							>
								<Lock size={12} />
								Confirm Password
							</label>
							<div class="relative group">
								<input
									type="password"
									id="reg-confirm-password"
									bind:value={regConfirmPassword}
									placeholder="••••••••"
									required
									class="w-full bg-white/[0.02] border border-white/10 rounded-sm px-4 py-3.5 text-sm text-white font-label tracking-wider focus:outline-none focus:border-primary/50 focus:bg-white/5 transition-all placeholder:text-white/10"
								/>
								<div
									class="absolute bottom-0 left-0 right-0 h-[2px] bg-primary scale-x-0 group-focus-within:scale-x-100 transition-transform origin-left"
								></div>
							</div>
						</div>

						<!-- Error -->
						{#if authStore.error}
							<div
								class="flex items-start gap-3 p-4 bg-secondary/10 border border-secondary/30 rounded-sm shadow-[0_0_15px_rgba(255,61,0,0.1)]"
								in:fly={{ y: -8, duration: 300 }}
							>
								<AlertCircle class="text-secondary flex-shrink-0 mt-0.5" size={16} />
								<p
									class="text-[11px] text-secondary font-label font-bold tracking-wider uppercase leading-relaxed"
								>
									{authStore.error}
								</p>
							</div>
						{/if}

						<button
							type="submit"
							disabled={isSubmitting ||
								!regUsername.trim() ||
								!regEmail.trim() ||
								!regPassword ||
								!regConfirmPassword}
							class="w-full py-4 bg-primary text-surface font-headline font-bold tracking-[0.3em] uppercase relative overflow-hidden hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:scale-100 shadow-[0_0_20px_rgba(0,255,255,0.2)] mt-2"
						>
							{#if isSubmitting}
								<div class="flex items-center justify-center gap-2">
									<Loader2 size={18} class="animate-spin" />
									<span>REGISTERING...</span>
								</div>
							{:else}
								CREATE OPERATIVE
							{/if}
						</button>
					</form>
				{/if}
			</div>

			<!-- Footer -->
			<div
				class="px-10 pb-8 pt-2 flex justify-between items-center text-[9px] font-label text-white/15 tracking-[0.2em] uppercase"
			>
				<span>ENCRYPTED CONNECTION</span>
				<div class="flex gap-1">
					<div class="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
					<div class="w-1 h-1 bg-primary rounded-full animate-pulse [animation-delay:0.2s]"></div>
					<div class="w-1 h-1 bg-primary rounded-full animate-pulse [animation-delay:0.4s]"></div>
				</div>
				<span>v2.4.1</span>
			</div>
		</div>
	</div>
</div>

<style>
	@keyframes scan {
		0% {
			top: 0;
		}
		100% {
			top: 100%;
		}
	}
</style>

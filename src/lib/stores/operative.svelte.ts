import { supabase } from '$lib/supabase';
import type { Operative, OperativeStats } from '$lib/types';

const STORAGE_KEY = 'arena-ops-operative';

function loadFromStorage(): Operative | null {
	if (typeof window === 'undefined') return null;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? (JSON.parse(raw) as Operative) : null;
	} catch {
		return null;
	}
}

function saveToStorage(operative: Operative): void {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(operative));
}

function clearStorage(): void {
	localStorage.removeItem(STORAGE_KEY);
}

/** Reactive operative session store using Svelte 5 runes. */
function createOperativeStore() {
	let operative = $state<Operative | null>(loadFromStorage());
	let stats = $state<OperativeStats>({ operative_id: '', wins: 0, losses: 0, draws: 0 });
	let loading = $state(false);
	let error = $state<string | null>(null);

	const isLoggedIn = $derived(operative !== null);
	const callsign = $derived(operative?.callsign ?? '');
	const equippedSkin = $derived(operative?.active_skin ?? 'Default Neon');
	const totalGames = $derived(stats.wins + stats.losses + stats.draws);
	const winRate = $derived(totalGames > 0 ? Math.round((stats.wins / totalGames) * 100) : 0);

	/** Load stats from Supabase for the current operative. */
	async function loadStats(): Promise<void> {
		if (!operative) return;

		const { data } = await supabase
			.from('operative_stats')
			.select('*')
			.eq('operative_id', operative.id)
			.single();

		if (data) {
			stats = data as OperativeStats;
		}
	}

	/** Register a new callsign or reconnect if it already exists. */
	async function login(newCallsign: string): Promise<boolean> {
		const trimmed = newCallsign.trim();
		if (!trimmed) {
			error = 'Callsign cannot be empty.';
			return false;
		}

		loading = true;
		error = null;

		try {
			// Try to find an existing operative with this callsign
			const { data: existing } = await supabase
				.from('operatives')
				.select('*')
				.eq('callsign', trimmed)
				.single();

			if (existing) {
				operative = existing as Operative;
			} else {
				// Create a new operative
				const { data: created, error: insertError } = await supabase
					.from('operatives')
					.insert({ callsign: trimmed })
					.select()
					.single();

				if (insertError) throw insertError;

				operative = created as Operative;

				// Initialize stats row
				await supabase.from('operative_stats').insert({
					operative_id: operative!.id,
					wins: 0,
					losses: 0,
					draws: 0
				});
			}

			saveToStorage(operative!);
			await loadStats();
			return true;
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'Failed to register callsign.';
			return false;
		} finally {
			loading = false;
		}
	}

	/** Log out and clear local session. */
	function logout(): void {
		operative = null;
		stats = { operative_id: '', wins: 0, losses: 0, draws: 0 };
		clearStorage();
	}

	/** Refresh stats from Supabase (called after each round). */
	async function refreshStats(): Promise<void> {
		await loadStats();
	}

	/** Auto-load stats on initialization if a session exists in localStorage. */
	const _initial = loadFromStorage();
	if (_initial) {
		loadStats();
	}

	/** Update operative profile data. */
	async function updateOperative(updates: Partial<Operative>): Promise<boolean> {
		if (!operative) return false;

		loading = true;
		error = null;

		try {
			const { data, error: updateError } = await supabase
				.from('operatives')
				.update(updates)
				.eq('id', operative.id)
				.select()
				.single();

			if (updateError) throw updateError;

			operative = data as Operative;
			saveToStorage(operative);
			return true;
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'Failed to update profile.';
			return false;
		} finally {
			loading = false;
		}
	}

	return {
		get operative() {
			return operative;
		},
		get stats() {
			return stats;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		get isLoggedIn() {
			return isLoggedIn;
		},
		get callsign() {
			return callsign;
		},
		get totalGames() {
			return totalGames;
		},
		get winRate() {
			return winRate;
		},
		get equippedSkin() {
			return equippedSkin;
		},
		login,
		logout,
		refreshStats,
		updateOperative,
		async resetStats(): Promise<void> {
			if (!operative) return;
			try {
				await supabase
					.from('operative_stats')
					.update({ wins: 0, losses: 0, draws: 0 })
					.eq('operative_id', operative.id);
				await loadStats();
			} catch (e) {
				console.error('Failed to reset stats:', e);
			}
		}
	};
}

export const operativeStore = createOperativeStore();

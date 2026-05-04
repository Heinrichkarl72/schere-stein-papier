import { supabase } from '$lib/supabase';
import { getBotMove, determineResult } from '$lib/engine';
import { operativeStore } from '$lib/stores/operative.svelte';
import type { Move, Result, GameSession } from '$lib/types';

export type GamePhase = 'idle' | 'selecting' | 'revealing' | 'result';

const REVEAL_DELAY_MS = 1500;

/** Reactive game flow store using Svelte 5 runes. */
function createGameStore() {
	let phase = $state<GamePhase>('idle');
	let playerMove = $state<Move | null>(null);
	let botMove = $state<Move | null>(null);
	let result = $state<Result | null>(null);
	let roundHistory = $state<GameSession[]>([]);
	let streak = $state(0);
	let bestStreak = $state(0);

	const isPlaying = $derived(phase !== 'idle');
	const roundCount = $derived(roundHistory.length);

	/** Start a new game session – transitions from idle to selecting. */
	function startGame(): void {
		if (phase !== 'idle' && phase !== 'result') return;
		phase = 'selecting';
		playerMove = null;
		botMove = null;
		result = null;
	}

	/** Player selects a move – triggers reveal animation then result. */
	async function selectMove(move: Move): Promise<void> {
		if (phase !== 'selecting') return;

		playerMove = move;
		phase = 'revealing';

		// Generate bot move
		const bot = getBotMove();
		botMove = bot;

		// Brief reveal delay for animation
		await new Promise((resolve) => setTimeout(resolve, REVEAL_DELAY_MS));

		// Determine result
		const roundResult = determineResult(move, bot);
		result = roundResult;
		phase = 'result';

		// Update streak
		if (roundResult === 'win') {
			streak += 1;
			if (streak > bestStreak) bestStreak = streak;
		} else {
			streak = 0;
		}

		// Persist to Supabase
		await persistRound(move, bot, roundResult);
	}

	/** Persist the round to game_sessions and update operative_stats. */
	async function persistRound(pMove: Move, bMove: Move, roundResult: Result): Promise<void> {
		const operative = operativeStore.operative;
		if (!operative) return;

		try {
			// Insert game session
			const { data: session } = await supabase
				.from('game_sessions')
				.insert({
					operative_id: operative.id,
					player_move: pMove,
					bot_move: bMove,
					result: roundResult
				})
				.select()
				.single();

			if (session) {
				roundHistory = [...roundHistory, session as GameSession];
			}

			// Update operative stats
			const column = roundResult === 'win' ? 'wins' : roundResult === 'loss' ? 'losses' : 'draws';

			const { data: currentStats } = await supabase
				.from('operative_stats')
				.select(column)
				.eq('operative_id', operative.id)
				.single();

			if (currentStats) {
				await supabase
					.from('operative_stats')
					.update({ [column]: (currentStats as Record<string, number>)[column] + 1 })
					.eq('operative_id', operative.id);
			}

			// Refresh the operative store's stats
			await operativeStore.refreshStats();
		} catch (e) {
			console.error('Failed to persist round:', e);
		}
	}

	/** Play another round (from result → selecting). */
	function playAgain(): void {
		if (phase !== 'result') return;
		phase = 'selecting';
		playerMove = null;
		botMove = null;
		result = null;
	}

	/** Reset game to idle state. */
	function reset(): void {
		phase = 'idle';
		playerMove = null;
		botMove = null;
		result = null;
		roundHistory = [];
		streak = 0;
		bestStreak = 0;
	}

	return {
		get phase() {
			return phase;
		},
		get playerMove() {
			return playerMove;
		},
		get botMove() {
			return botMove;
		},
		get result() {
			return result;
		},
		get roundHistory() {
			return roundHistory;
		},
		get streak() {
			return streak;
		},
		get bestStreak() {
			return bestStreak;
		},
		get isPlaying() {
			return isPlaying;
		},
		get roundCount() {
			return roundCount;
		},
		startGame,
		selectMove,
		playAgain,
		reset
	};
}

export const gameStore = createGameStore();

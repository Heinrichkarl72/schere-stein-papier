import type { Move, Result } from '$lib/types';

/** All valid moves. */
export const MOVES: Move[] = ['rock', 'paper', 'scissors'];

/** Human-readable emoji labels for each move. */
export const MOVE_EMOJI: Record<Move, string> = {
	rock: '🪨',
	paper: '📄',
	scissors: '✂️'
};

/** Human-readable display labels for each move. */
export const MOVE_LABEL: Record<Move, string> = {
	rock: 'ROCK',
	paper: 'PAPER',
	scissors: 'SCISSORS'
};

/** What each move beats. */
const BEATS: Record<Move, Move> = {
	rock: 'scissors',
	paper: 'rock',
	scissors: 'paper'
};

/** Generate a random bot move. */
export function getBotMove(): Move {
	return MOVES[Math.floor(Math.random() * MOVES.length)];
}

/** Determine the result from the player's perspective. */
export function determineResult(playerMove: Move, botMove: Move): Result {
	if (playerMove === botMove) return 'draw';
	return BEATS[playerMove] === botMove ? 'win' : 'loss';
}

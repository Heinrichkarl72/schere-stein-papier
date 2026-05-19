import { supabase } from '$lib/supabase';
import { operativeStore } from '$lib/stores/operative.svelte';
import { base } from '$app/paths';

// Reactive auth store using Svelte 5 runes.
function createAuthStore() {
	let sessionState = $state<any>(null);
	let error = $state<string | null>(null);
	let loading = $state(false);

	const isAuthenticated = $derived(sessionState !== null);
	const username = $derived(
		sessionState?.user?.user_metadata?.username ??
		sessionState?.user?.email?.split('@')[0] ??
		''
	);

	// Setup onAuthStateChange listener on initialization (only on client)
	if (typeof window !== 'undefined') {
		// First get current session
		supabase.auth.getSession().then(({ data: { session } }) => {
			sessionState = session;
			if (session) {
				const uName = session.user?.user_metadata?.username || session.user?.email?.split('@')[0] || '';
				operativeStore.login(uName);
			}
		});

		supabase.auth.onAuthStateChange((event, session) => {
			sessionState = session;
			if (session) {
				const uName = session.user?.user_metadata?.username || session.user?.email?.split('@')[0] || '';
				operativeStore.login(uName);
			} else {
				operativeStore.logout();
			}
		});
	}

	/** Register a new account using Supabase Auth. */
	async function register(
		newUsername: string,
		email: string,
		password: string,
		confirmPassword: string
	): Promise<boolean> {
		error = null;

		const trimmedUsername = newUsername.trim();
		const trimmedEmail = email.trim().toLowerCase();

		if (!trimmedUsername || !trimmedEmail || !password) {
			error = 'SECURITY ALERT: ALL FIELDS ARE REQUIRED';
			return false;
		}

		if (password !== confirmPassword) {
			error = 'AUTHENTICATION FAILURE: PASSWORDS DO NOT MATCH';
			return false;
		}

		if (password.length < 6) {
			error = 'SECURITY ALERT: PASSWORD MUST BE AT LEAST 6 CHARACTERS';
			return false;
		}

		loading = true;

		try {
			const { data, error: signUpError } = await supabase.auth.signUp({
				email: trimmedEmail,
				password: password,
				options: {
					emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}${base}/` : undefined,
					data: {
						username: trimmedUsername
					}
				}
			});

			if (signUpError) {
				error = `ACCESS DENIED: ${signUpError.message.toUpperCase()}`;
				return false;
			}

			// If session is active (email confirmation disabled in Supabase), log in
			if (data.session) {
				sessionState = data.session;
				await operativeStore.login(trimmedUsername);
			} else {
				// If email confirmation is required, notify the user
				error = 'REGISTRATION SUCCESSFUL. PLEASE CHECK YOUR EMAIL TO CONFIRM YOUR ACCOUNT.';
				return false;
			}

			return true;
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'SYSTEM ERROR: REGISTRATION FAILED';
			return false;
		} finally {
			loading = false;
		}
	}

	/** Sign in with existing credentials. */
	async function signIn(email: string, password: string): Promise<boolean> {
		error = null;

		const trimmedEmail = email.trim().toLowerCase();

		if (!trimmedEmail || !password) {
			error = 'SECURITY ALERT: ALL FIELDS ARE REQUIRED';
			return false;
		}

		loading = true;

		try {
			const { data, error: signInError } = await supabase.auth.signInWithPassword({
				email: trimmedEmail,
				password: password
			});

			if (signInError) {
				error = 'ACCESS DENIED: INVALID CREDENTIALS';
				return false;
			}

			if (data.session) {
				sessionState = data.session;
				const uName = data.session.user?.user_metadata?.username || data.session.user?.email?.split('@')[0] || '';
				await operativeStore.login(uName);
			}

			return true;
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'SYSTEM ERROR: SIGN IN FAILED';
			return false;
		} finally {
			loading = false;
		}
	}

	/** Sign out and clear all session data. */
	async function signOut(): Promise<void> {
		error = null;
		loading = true;
		try {
			await supabase.auth.signOut();
			sessionState = null;
			operativeStore.logout();
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'SYSTEM ERROR: SIGN OUT FAILED';
		} finally {
			loading = false;
		}
	}

	return {
		get isAuthenticated() {
			return isAuthenticated;
		},
		get username() {
			return username;
		},
		get error() {
			return error;
		},
		get loading() {
			return loading;
		},
		register,
		signIn,
		signOut
	};
}

export const authStore = createAuthStore();

<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { authStore } from '$lib/stores/auth.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import SecurityGateway from '$lib/components/SecurityGateway.svelte';

	let { children } = $props();

	const isAtRoot = $derived(
		page.url.pathname === `${base}` || 
		page.url.pathname === `${base}/`
	);

	$effect(() => {
		if (!authStore.isAuthenticated && !isAtRoot) {
			goto(`${base}/`);
		}
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if authStore.isAuthenticated}
	{@render children()}
{:else}
	<SecurityGateway />
{/if}

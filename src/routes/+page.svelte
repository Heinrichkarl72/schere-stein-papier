<script lang="ts">
	import { operativeStore } from '$lib/stores/operative.svelte';
	import OperativeAuth from '$lib/components/OperativeAuth.svelte';
	import Header from '$lib/components/Header.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import StatsSidebar from '$lib/components/StatsSidebar.svelte';
	import GameArena from '$lib/components/GameArena.svelte';
	import Footer from '$lib/components/Footer.svelte';
</script>

<svelte:head>
	<title>ARENA.OPS | Digital Rock Paper Scissors</title>
	<meta name="description" content="The most advanced digital rock paper scissors arena ever built." />
</svelte:head>

{#if !operativeStore.isLoggedIn}
	<OperativeAuth />
{:else}
	<div class="flex flex-col h-screen bg-surface selection:bg-primary/20 selection:text-white">
		<Header />

		<main class="flex-1 flex overflow-hidden">
			<Sidebar />
			<GameArena />
			<StatsSidebar />
		</main>

		<Footer />
	</div>
{/if}

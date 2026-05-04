<script lang="ts">
	const currentYear = new Date().getFullYear();
</script>

<footer class="flex items-center justify-between px-8 py-4 border-t border-white/5 text-[10px] font-label font-medium text-white/30 tracking-[0.1em] uppercase">
	<div>
		© {currentYear} DIGITAL ARENA TERMINAL. ALL RIGHTS RESERVED.
	</div>
	<div class="flex items-center gap-8">
		<a href="/privacy" class="hover:text-white transition-colors">PRIVACY</a>
		<a href="/terms" class="hover:text-white transition-colors">TERMS</a>
		<a href="/resources" class="hover:text-white transition-colors">RESOURCES</a>
	</div>
</footer>

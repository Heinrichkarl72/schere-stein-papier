<script lang="ts">
	import { 
		Ghost, Shield, Zap, Crosshair, Eye, Binary, Cpu, Fingerprint, User
	} from 'lucide-svelte';
	
	let { avatar, size = 20, class: className = '' } = $props();

	const icons = {
		'Ghost': Ghost,
		'Shield': Shield,
		'Zap': Zap,
		'Target': Crosshair,
		'Eye': Eye,
		'Binary': Binary,
		'Cpu': Cpu,
		'Fingerprint': Fingerprint
	};

	const Icon = $derived(icons[avatar as keyof typeof icons] || User);
</script>

<Icon size={size} class={className} />

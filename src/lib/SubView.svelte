<script lang="ts">
	import type { Run } from '$lib/types';
	import Progress from '$lib/Progress.svelte';
	export let sub: Run;

	//$: runNumber = isNaN(sub.runNumber) ? '?' : sub.runNumber.toFixed(0);
</script>

<div>
	<span>{`Worker# ${sub.workerNum.toFixed(0).padStart(2,'0')}`}</span>
	<Progress value={sub.percent}/>
	<span>{sub.count}</span>
	<span>{sub.text}</span>
</div>

<style>
</style>

<script lang="ts">
	import type { Run } from '$lib/types';
	import Progress from '$lib/Progress.svelte';
	export let run: Run;

	$: workerNum = isNaN(run.workerNum) ? '?' : run.workerNum.toFixed(0);
</script>

<div>
	<span>{`Run# ${run.runNumber.toFixed(0).padStart(2, '0')}`}</span>
	<Progress value={run.percent}/>
	<span>{run.text}</span>
</div>

<style>
</style>

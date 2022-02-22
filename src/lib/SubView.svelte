<script lang="ts">
	import type { Sub } from '$lib/types';
	import Progress from '$lib/Progress.svelte';
	import Run from '$lib/RunView.svelte';
	export let sub: Sub;

	//$: runNumber = isNaN(sub.runNumber) ? '?' : sub.runNumber.toFixed(0);
</script>

<tr>
	<td>{`${sub.workerNum.toFixed(0).padStart(2, '0')}`}</td>
	<td><Progress value={sub.percent} /></td>
	<td>{sub.runCount}</td>
	<td>{`${(sub.totalElapsed / 1000).toFixed(1)}s`}</td>
	<td>{`${sub.percentElapsed.toFixed(1)}%`}</td>
	<td>
		{#each sub.runsCompleted as run}
			<Run {run} />
		{/each}
	</td>
</tr>

<style>
	td {
		text-align: center;
		border: 1px solid #aaa;
	}
</style>

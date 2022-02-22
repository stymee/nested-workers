<script lang="ts">
	import type { Sub } from '$lib/types';
	import Progress from '$lib/Progress.svelte';
	import SubRunComp from '$lib/SubRunComp.svelte';
	export let sub: Sub;
</script>

<tr>
	<td>{`${sub.workerNum.toFixed(0).padStart(2, '0')}`}</td>
	<td><Progress value={sub.percent} /></td>
	<td>{sub.runCount}</td>
	<td>{`${(sub.totalElapsed / 1000).toFixed(1)}s`}</td>
	<td>{`${sub.percentElapsed.toFixed(1)}%`}</td>
	<td class="runs">
		{#each sub.runsCompleted as run}
			<SubRunComp {run} />
		{/each}
	</td>
</tr>

<style>
	/* tr {
		padding: 0;
		margin: 0;
	} */
	td {
		padding: 2px;
		text-align: center;
		border: 1px solid #aaa;
	}
	td.runs {
		text-align: start;
	}
</style>

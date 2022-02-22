<script lang="ts">
	import SubView from '$lib/SubView.svelte';
	import RunView from '$lib/RunView.svelte';
	import Progress from '$lib/Progress.svelte';
	import { workerQueue } from '$lib/workerQueue';

	$: mainText = `total Elapsed ${($workerQueue.elapsed / 1000).toFixed(2)} sec, subElapsed = ${(
		$workerQueue.subElapsed / 1000
	).toFixed(2)} sec`;
</script>

<div>
	<label>
		<input type="range" min="10" max="40" bind:value={$workerQueue.runCount} />
		{$workerQueue.runCount} runs
	</label>
</div>
<div>
	<label>
		<input type="range" min="1" max="12" bind:value={$workerQueue.workerCount} />
		{$workerQueue.workerCount} workers
	</label>
</div>
<button on:click={() => workerQueue.startCompute()} disabled={$workerQueue.isBusy}
	>Start Main</button
>
<div>
	<span>Main Progress</span>
	<Progress value={$workerQueue.progress} />
	<span>{mainText}</span>
</div>

<div class="runs">
	{#each $workerQueue.runs as run}
		<RunView {run} />
	{/each}
</div>

<div class="subs">
	{#each $workerQueue.subs as sub}
		<SubView {sub} />
	{/each}
</div>

<style>
	div {
		padding: 10px;
	}

	.runs {
		padding: 10px;
	}

	.subs {
		padding: 5px;
	}
</style>

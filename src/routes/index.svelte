<script lang="ts">
	import '../style.css';
	import SubView from '$lib/SubView.svelte';
	import RunView from '$lib/RunView.svelte';
	import Progress from '$lib/Progress.svelte';
	import { workerQueue } from '$lib/workerQueue';

	$: mainText = `total Elapsed ${($workerQueue.elapsed / 1000).toFixed(2)} sec, subElapsed = ${(
		$workerQueue.subElapsed / 1000
	).toFixed(2)} sec`;
</script>

<h1>Nested Worker Demo</h1>

<nav>
	<section>
		<label>
			<input type="range" min="10" max="1000" bind:value={$workerQueue.runDepth} />
			depth = {$workerQueue.runDepth.toLocaleString()} M
		</label>
	</section>
	<section>
		<label>
			<input type="range" min="10" max="200" bind:value={$workerQueue.runCount} />
			runs = {$workerQueue.runCount}
		</label>
	</section>
	<section>
		<label>
			<input type="range" min="1" max="24" bind:value={$workerQueue.workerCount} />
			workers = {$workerQueue.workerCount}
		</label>
	</section>
	<section>
		<label>
			<input type="checkbox" bind:checked={$workerQueue.optimized} />
			Optimizied Queueueueueing = {$workerQueue.optimized}
		</label>
	</section>
	<section>
		<button on:click={() => workerQueue.startCompute()} disabled={$workerQueue.isBusy}>Start</button
		>
		<button on:click={() => workerQueue.stopCompute()} disabled={!$workerQueue.isBusy}>Stop</button>
	</section>
</nav>

<div class="runs">
	{#each $workerQueue.runs as run}
		<RunView {run} />
	{/each}
</div>

<table>
	<thead>
		<tr>
			<th>Worker</th>
			<th>Progress</th>
			<th>Count</th>
			<th>Total Sec</th>
			<th>% Sec</th>
			<th>Runs Completed</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>Main</td>
			<td><Progress value={$workerQueue.progress} /></td>
			<td>{$workerQueue.subs.reduce((acc, v) => (acc += v.runCount), 0)}</td>
			<td colspan="3">{mainText}</td>
		</tr>
		{#each $workerQueue.subs as sub}
			<SubView {sub} />
		{/each}
		<tr>
			<td />
			<td />
			<td>{$workerQueue.subs.reduce((acc, v) => (acc += v.runCount), 0)}</td>
			<td
				>{`${($workerQueue.subs.reduce((acc, v) => (acc += v.totalElapsed), 0) / 1000).toFixed(
					2
				)}s`}</td
			>
			<td>{`${$workerQueue.subs.reduce((acc, v) => (acc += v.percentElapsed), 0).toFixed(1)}%`}</td>
			<td />
		</tr>
	</tbody>
</table>

<style>
	section {
		margin-top: 0.5em;
	}
	button {
		font-size: 1.12em;
		padding: 0.5em;
		margin-right: 0.5em;
	}

	div.runs {
		padding: 10px 0px;
	}

	table {
		border: 1px solid #aaa;
		border-collapse: collapse;
		border-spacing: 0;
		padding: 0;
		margin: 0;
	}
	th {
		padding: 0.5em;
		border: 1px solid #aaa;
	}
	td {
		text-align: center;
		border: 1px solid #aaa;
	}
</style>

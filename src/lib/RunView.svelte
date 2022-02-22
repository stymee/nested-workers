<script lang="ts">
	import type { Run } from '$lib/types';
	export let run: Run;

	let height = 40;
	let width = 60;
	let color = '#f9f9f9';
	$: {
		switch (run.state) {
			case 'active':
				color = '#0c0';
				break;

			case 'ready':
				color = '#f9f9f9';
				break;

			case 'complete':
				color = '#05f';
				break;
		}
	}
	$: worker = isNaN(run.workerNum) ? 'w--' : `w${run.workerNum.toFixed(0).padStart(2, '0')}`;
	$: bar = (run.percent / 100) * width;
</script>

<svg x="0" y="0" {width} {height}>
	<rect x={0} y={0} {width} {height} fill="none" stroke="#a5a5a5" />
	<rect x={0} y={0} width={bar} {height} fill={color} />
	<text x={2} y={2} dy=".8em" font-size="12px" fill="#a5a5a5">
		{run.runNumber}
	</text>
	<text x={2} y={height} dy="-0.2em" font-size="12px" fill="#a5a5a5">
		{worker}
	</text>
	{#if run.state === 'active'}
		<text x={width / 2} y={height / 2} dy="0.4em" font-size="12px" fill="#a5a5a5">
			{`${run.percent.toFixed(0)}%`}
		</text>
	{:else if run.state === 'complete'}
		<text x={width / 2} y={height / 2} dy="0.4em" font-size="12px" fill="#a5a5a5">
			{`${(run.elapsed / 1000).toFixed(2)}s`}
		</text>
	{/if}

	
</svg>

<style>
	svg {
		margin: 0px 2px;
	}
	text {
		text-align: center;
	}
</style>

<script lang="ts">
	import type { Run } from '$lib/types';
	export let run: Run;

	let height = 18;
	let color = '#0af';
	$: bar = (run.elapsed / 1000) * 50;
</script>

<svg x="0" y="0" width={bar} height="18">
	<rect x={0} y={0} width={bar} {height} fill={color} stroke="#555" />
	<text x={2} y={height / 2} dy=".4em" font-size="12px" fill="#555">
		{`${run.runNumber.toFixed(0).padStart(2,'0')}@${(run.elapsed / 1000).toFixed(2)}s`}
	</text>
</svg>

<style>
	svg {
		margin: 0;
	}
	text {
		text-align: center;
	}
</style>

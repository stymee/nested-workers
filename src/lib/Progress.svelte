<script lang="ts">
	export let height: number = 22;
	export let width: number = 400;
	export let max: number = 100;
	export let value: number = 0;
	export let color: string = '#05f';

	$: bar = (value / max) * width;
	$: percent = (value / max) * 100;
</script>

<svg x="0" y="0" {width} {height}>
	<rect x={0} y={0} {width} {height} fill="none" />
	<rect x={0} y={0} width={bar} {height} fill={color} />
	<text x={width / 2} y={height / 2} dy="0.4em" font-size="12px" fill="#a5a5a5">
		{`${percent.toFixed(0)}%`}
	</text>
</svg>

<style>
	text {
		text-align: center;
	}
</style>

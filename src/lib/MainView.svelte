<script lang="ts">
	import { onMount } from 'svelte';
	import WorkerMain from '$lib/main-worker?worker';
	import SubView from '$lib/SubView.svelte';
	import RunView from '$lib/RunView.svelte';
	import Progress from '$lib/Progress.svelte';
	import type { MainInit, MainMsg, Status, Run, SubComplete, MainComplete } from '$lib/types';

	let mainWorker: Worker;
	let runCount = 20;
	let runComplete = 0;
	let subWorkerCount = 4;
	let isBusy = false;

	let mainText = '';

	let subs: Array<Run>;
	let runs: Array<Run>;
	let perf: number;

	const startMain = (): void => {
		isBusy = true;
		subs = new Array<Run>();
		for (let i = 0; i < subWorkerCount; i++) {
			subs.push({
				workerNum: i,
				runNumber: NaN,
				elapsed: 0,
				percent: 0,
				text: '',
				count: 0
			} as Run);
		}
		runs = new Array<Run>();
		for (let i = 0; i < runCount; i++) {
			runs.push({
				workerNum: NaN,
				runNumber: i,
				elapsed: 0,
				percent: 0,
				text: ''
			} as Run);
		}

		perf = performance.now();
		mainWorker.postMessage({
			msgType: 'init',
			payload: {
				workerCount: subWorkerCount,
				mainRunCount: runCount
			} as MainInit
		} as MainMsg);
	};

	// $: {
	// 	subs = new Array<Run>();
	// 	for (let i = 0; i < subWorkerCount; i++) {
	// 		subs.push({
	// 			workerNum: i,
	// 			runNumber: NaN,
	// 			elapsed: 0,
	// 			percent: 0,
	// 			text: '',
	// 			count: 0
	// 		} as Run);
	// 	}
	// 	runs = new Array<Run>();
	// 	for (let i = 0; i < runCount; i++) {
	// 		runs.push({
	// 			workerNum: NaN,
	// 			runNumber: i,
	// 			elapsed: 0,
	// 			percent: 0,
	// 			text: ''
	// 		} as Run);
	// 	}

	// }

	const onMainMessage = (msg: MessageEvent<MainMsg>): void => {
		switch (msg.data.msgType) {
			case 'status':
				const statusMsg = msg.data.payload as Status;
				const ws = subs[statusMsg.workerNum];
				if (ws) {
					ws.runNumber = statusMsg.runNumber;
					ws.percent = statusMsg.percent;
					ws.text = statusMsg.text;
				}
				const rs = runs[statusMsg.runNumber];
				if (rs) {
					rs.workerNum = statusMsg.workerNum;
					rs.percent = statusMsg.percent;
					rs.text = statusMsg.text;
				}
				runs = [...runs];
				subs = [...subs];

				//console.log('got a from', msg.data.text);
				break;

			case 'sub-complete':
				runComplete ++;
				const subCompleteMsg = msg.data.payload as SubComplete;

				const wc = subs[subCompleteMsg.workerNum];
				if (wc) {
					wc.count = wc.count + 1;
					wc.percent = 100;
					wc.text = '';
				}

				const rc = runs[subCompleteMsg.mainRunNumber];
				if (rc) {
					rc.elapsed = subCompleteMsg.elapsed;
					rc.percent = 100;
					rc.text = `${(subCompleteMsg.elapsed/1000).toFixed(2)}sec, worker# ${subCompleteMsg.workerNum.toFixed(0).padStart(2, '0')}`
				}
				runs = [...runs];
				subs = [...subs];

				break;

			case 'main-complete':
				isBusy = false;
				const mainCompleteMsg = msg.data.payload as MainComplete;
				mainText = `total Elapsed ${((performance.now() - perf) / 1000).toFixed(2)} sec, subElapsed = ${(mainCompleteMsg.subElapsed / 1000).toFixed(2)} sec`
				
				//console.log('got a status', msg.data.text);
				break;

			default:
				console.error(`Unsupported msg type ${msg.data.msgType}`);
				break;
		}
	};

	onMount(() => {
		mainWorker = new WorkerMain();
		mainWorker.onmessage = onMainMessage;

	});
</script>
<div>
	<label>
		<input type="range" min="10" max="40" bind:value={runCount} />
		{runCount} runs
	</label>
</div>
<div>
	<label>
		<input type="range" min="1" max="12" bind:value={subWorkerCount} />
		{subWorkerCount} workers
	</label>
</div>
<button on:click={startMain} disabled={isBusy}>Start Main</button>
<div>
	<span>Main Progress</span>
	<Progress value={runComplete} max={runCount}/>
	<span>{mainText}</span>
</div>

<div class="runs">
	{#if runs?.length > 0}
		{#each runs as run}
			<RunView {run} />
		{/each}
	{/if}
</div>

<div class="subs">
	{#if subs?.length > 0}
		{#each subs as sub}
			<SubView {sub} />
		{/each}
	{/if}
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

import { writable, get } from 'svelte/store';
import WorkerMain from '$lib/main-worker?worker';
import type { MainInit, MainMsg, SubComplete, Status, Run, Sub } from '$lib/types';

type WorkerQueue = {
	isBusy: boolean;
	workerCount: number;
	runCount: number;
	runDepth: number;
	optimized: boolean;
	runs: Array<Run>;
	subs: Array<Sub>;
	progress: number;
	elapsed: number;
	subElapsed: number;
};

let mainWorker: Worker;
let totalProgress: number;
let perf: number;

function createWorkerQueue() {
	const { subscribe, set, update } = writable<WorkerQueue>({
		isBusy: false,
		workerCount: 6,
		runCount: 24,
		runDepth: 500,
		optimized: true,
		runs: new Array<Run>(),
		subs: new Array<Sub>(),
		progress: 0,
		elapsed: 0,
		subElapsed: 0
	} as WorkerQueue);

	return {
		subscribe,
		set,
		update,

		stopCompute: (): void => {
			if (mainWorker) {
				mainWorker.postMessage({
					msgType: 'cancel',
					payload: null
				} as MainMsg)
			}
			//console.log("got a stop command, sorry it doesn't actually do anything yet.");
		},

		startCompute: (): void => _startCompute()
	};
}

export const workerQueue = createWorkerQueue();

const _startCompute = (): void => {
	const me = get(workerQueue);
	perf = performance.now();
	if (!mainWorker) mainWorker = new WorkerMain();

	totalProgress = me.runCount * 100;

	mainWorker.onmessage = (msg: MessageEvent<MainMsg>): void => {
		switch (msg.data.msgType) {
			case 'status':
				_onStatus(msg.data.payload as Status);
				break;

			case 'sub-complete':
				_onSubComplete(msg.data.payload as SubComplete);
				break;

			case 'main-complete':
				workerQueue.update((self) => {
					self.isBusy = false;
					self.subs.forEach((sub) => {
						sub.percentElapsed = (sub.totalElapsed / self.subElapsed) * 100;
					});
					return self;
				});
				break;

			default:
				console.error(`Unsupported msg type ${msg.data.msgType}`);
				break;
		}
	};

	workerQueue.update((self) => {
		self.isBusy = true;
		self.subs = new Array<Sub>();
		for (let i = 0; i < self.workerCount; i++) {
			self.subs.push({
				workerNum: i,
				runNumber: NaN,
				totalElapsed: 0,
				percentElapsed: 0,
				percent: 0,
				runCount: 0,
				runsCompleted: new Array<Run>(),
				text: ''
			} as Sub);
		}
		self.runs = new Array<Run>();
		for (let i = 0; i < self.runCount; i++) {
			self.runs.push({
				runNumber: i,
				state: 'ready',
				workerNum: NaN,
				elapsed: 0,
				percent: 0,
				text: ''
			} as Run);
		}
		return self;
	});

	mainWorker.postMessage({
		msgType: 'init',
		payload: {
			workerCount: me.workerCount,
			runCount: me.runCount,
			runDepth: me.runDepth,
			optimized: me.optimized
		} as MainInit
	} as MainMsg);
};

const _onStatus = (statusMsg: Status): void => {
	workerQueue.update((self) => {
		const ws = self.subs[statusMsg.workerNum];
		if (ws) {
			ws.runNumber = statusMsg.runNumber;
			ws.percent = statusMsg.percent;
			ws.text = statusMsg.text;
		}
		const rs = self.runs[statusMsg.runNumber];
		if (rs) {
			rs.state = 'active';
			rs.workerNum = statusMsg.workerNum;
			rs.percent = statusMsg.percent;
			rs.text = statusMsg.text;
		}
		const currentProgress = self.runs.reduce((acc, v) => (acc += v.percent), 0);
		self.progress = (currentProgress / totalProgress) * 100;
		self.elapsed = performance.now() - perf;
		return self;
	});
};

const _onSubComplete = (subCompleteMsg: SubComplete): void => {
	workerQueue.update((self) => {
		const rc = self.runs[subCompleteMsg.runNumber];
		if (rc) {
			rc.elapsed = subCompleteMsg.elapsed;
			rc.percent = 100;
			rc.state = 'complete';
			rc.text = `${(subCompleteMsg.elapsed / 1000).toFixed(
				2
			)}sec, worker# ${subCompleteMsg.workerNum.toFixed(0).padStart(2, '0')}`;
		}
		const wc = self.subs[subCompleteMsg.workerNum];
		if (wc) {
			wc.runCount++;
			wc.percent = 100;
			wc.text = '';
			wc.totalElapsed += subCompleteMsg.elapsed;
			wc.percentElapsed = (wc.totalElapsed / self.subElapsed) * 100;
			wc.runsCompleted.push(rc);
		}
		const currentProgress = self.runs.reduce((acc, v) => (acc += v.percent), 0);
		self.progress = (currentProgress / totalProgress) * 100;
		self.elapsed = performance.now() - perf;
		self.subElapsed += rc.elapsed;

		return self;
	});
};

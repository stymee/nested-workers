import { writable, get } from 'svelte/store';
import WorkerMain from '$lib/main-worker?worker';
import type { MainInit, MainMsg, SubComplete, Status, Run, Sub } from '$lib/types';

type WorkerQueue = {
	isBusy: boolean;
	workerCount: number;
	runCount: number;
	runDepth: number;
	runs: Array<Run>;
	subs: Array<Sub>;
	progress: number;
	elapsed: number;
	subElapsed: number;
};

let mainWorker: Worker;

function createWorkerQueue() {
	const { subscribe, set, update } = writable<WorkerQueue>({
		isBusy: false,
		workerCount: 6,
		runCount: 24,
		runDepth: 500,
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
			console.log('got a stop command, sorry');
		},

		startCompute: (): void => {
			const me = get(workerQueue);
			const perf = performance.now();
			if (!mainWorker) mainWorker = new WorkerMain();

			const totalProgress = me.runCount * 100;
			let currentProgress = 0;

			let runsComplete = 0;
			mainWorker.onmessage = (msg: MessageEvent<MainMsg>): void => {
				switch (msg.data.msgType) {
					case 'status':
						const statusMsg = msg.data.payload as Status;
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

							currentProgress = self.runs.reduce((acc, v) => (acc += v.percent), 0);
							self.progress = (currentProgress / totalProgress) * 100;
							self.elapsed = performance.now() - perf;
							return self;
						});

						break;

					case 'sub-complete':
						runsComplete++;
						const subCompleteMsg = msg.data.payload as SubComplete;

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
							currentProgress = self.runs.reduce((acc, v) => (acc += v.percent), 0);
							self.progress = (currentProgress / totalProgress) * 100;
							self.elapsed = performance.now() - perf;
							self.subElapsed += rc.elapsed;

							return self;
						});

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
					runDepth: me.runDepth
				} as MainInit
			} as MainMsg);
		}
	};
}

export const workerQueue = createWorkerQueue();

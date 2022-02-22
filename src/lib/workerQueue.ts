import { writable, get } from 'svelte/store';
import WorkerMain from '$lib/main-worker?worker';
import type { MainInit, MainMsg, MainComplete, SubInit, SubMsg, SubComplete, Status, Run } from '$lib/types';

type WorkerQueue = {
	isBusy: boolean;
	workerCount: number;
	runCount: number;
	runDepth: number;
	runs: Array<Run>;
	subs: Array<Run>;
	progress: number;
	elapsed: number;
	subElapsed: number;
};

let mainWorker: Worker;

function createWorkerQueue() {
	const { subscribe, set, update } = writable<WorkerQueue>({
		isBusy: false,
		workerCount: 6,
		runCount: 20,
		runDepth: 6000,
		runs: new Array<Run>(),
		subs: new Array<Run>(),
		elapsed: 0,
		subElapsed: 0
	} as WorkerQueue);

	return {
		subscribe,
		set,
		update,

		startCompute: (): void => {
			const me = get(workerQueue);
			if (!mainWorker) mainWorker = new WorkerMain();

			let runsComplete = 0;
			mainWorker.onmessage = (msg: MessageEvent<MainMsg>): void => {
				switch (msg.data.msgType) {
					case 'status':
						const statusMsg = msg.data.payload as Status;
						workerQueue.update(self => {
							const ws = self.subs[statusMsg.workerNum];
							if (ws) {
								ws.runNumber = statusMsg.runNumber;
								ws.percent = statusMsg.percent;
								ws.text = statusMsg.text;
							}
							const rs = self.runs[statusMsg.runNumber];
							if (rs) {
								rs.workerNum = statusMsg.workerNum;
								rs.percent = statusMsg.percent;
								rs.text = statusMsg.text;
							}
							self.runs = [...self.runs];
							self.subs = [...self.subs];
							return self;
						})

						//console.log('got a from', msg.data.text);
						break;

					case 'sub-complete':
						runsComplete++;
						const subCompleteMsg = msg.data.payload as SubComplete;

						workerQueue.update(self => {
							const wc = self.subs[subCompleteMsg.workerNum];
							if (wc) {
								wc.count = wc.count + 1;
								wc.percent = 100;
								wc.text = '';
							}
	
							const rc = self.runs[subCompleteMsg.runNumber];
							if (rc) {
								rc.elapsed = subCompleteMsg.elapsed;
								rc.percent = 100;
								rc.text = `${(subCompleteMsg.elapsed / 1000).toFixed(
									2
								)}sec, worker# ${subCompleteMsg.workerNum.toFixed(0).padStart(2, '0')}`;
							}
							self.runs = [...self.runs];
							self.subs = [...self.subs];

							return self;
						})

						break;

					case 'main-complete':
						workerQueue.update(self => {
							self.isBusy = false;
							return self;
						})
						const mainCompleteMsg = msg.data.payload as MainComplete;
						// mainText = `total Elapsed ${((performance.now() - perf) / 1000).toFixed(
						// 	2
						// )} sec, subElapsed = ${(mainCompleteMsg.subElapsed / 1000).toFixed(2)} sec`;

						//console.log('got a status', msg.data.text);
						break;

					default:
						console.error(`Unsupported msg type ${msg.data.msgType}`);
						break;
				}
			};

			workerQueue.update(self => {
					self.isBusy = true;
					self.subs = new Array<Run>();
					for (let i = 0; i < self.workerCount; i++) {
						self.subs.push({
							workerNum: i,
							runNumber: NaN,
							elapsed: 0,
							percent: 0,
							text: '',
							count: 0
						} as Run);
					}
					self.runs = new Array<Run>();
					for (let i = 0; i < self.runCount; i++) {
						self.runs.push({
							workerNum: NaN,
							runNumber: i,
							elapsed: 0,
							percent: 0,
							text: ''
						} as Run);
					}
				return self;
			})

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

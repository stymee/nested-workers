declare var self: DedicatedWorkerGlobalScope;
import type {
	MainMsg,
	MainInit,
	MainComplete,
	SubMsg,
	SubInit,
	SubComplete,
	Status
} from '$lib/types';
import WorkerSub from './sub-worker?worker';

let runCount: number = 40;
let workerCount: number = 20;
let workerPool: Array<Worker>;

export default onmessage = async (e: MessageEvent<MainMsg>) => {
	//console.log('in main worker...', e.data);
	let perf = performance.now();
	if (e.data.msgType != 'init')
		console.error(`Main Worker received unsupported msg type ${e.data.msgType}`);

	const init = e.data.payload as MainInit;
	runCount = init.mainRunCount;
	workerCount = init.workerCount;

	workerPool = new Array(workerCount).fill(new WorkerSub());
	let completed = 0;
	let subElapsed = 0;
	workerPool.forEach((w) => {
		w.onmessage = (msg: MessageEvent<SubMsg>): void => {
			switch (msg.data.msgType) {
				case 'status':
					self.postMessage({
						msgType: 'status',
						payload: msg.data.payload
					} as MainMsg);
					break;

				case 'sub-complete':
					const msgComplete = msg.data.payload as SubComplete;
					self.postMessage(msg.data);
					completed++;
					subElapsed += msgComplete.elapsed;

					if (completed >= runCount) {
						self.postMessage({
							msgType: 'main-complete',
							payload: {
								mainRunsCompleted: completed,
								mainRunCount: runCount,
								elapsed: performance.now() - perf,
								subElapsed
							} as MainComplete
						} as MainMsg);
						workerPool.forEach((w) => w.terminate());
					}
					break;
			}
		};
	});

	let workerNum = 0;
	for (let j = 0; j < runCount; j++) {
		workerPool[workerNum].postMessage({
			msgType: 'init',
			payload: {
				workerNum,
				mainRunNumber: j,
				subRunCount: Math.random() * 10
			} as SubInit
		} as SubMsg);

		workerNum++;
		if (workerNum >= workerCount) {
			workerNum = 0;
		}
	}

	self.postMessage({
		msgType: 'status',
		payload: {
			workerNum: null,
			text: 'all runs submitted',
			percent: null
		} as Status
	} as MainMsg);
};

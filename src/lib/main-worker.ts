declare var self: DedicatedWorkerGlobalScope;
import type { MainMsg, MainInit, MainComplete, SubMsg, SubInit, SubComplete } from '$lib/types';
import WorkerSub from '$lib/sub-worker?worker';

let cancelMe: boolean;

export default onmessage = async (e: MessageEvent<MainMsg>) => {
	let perf = performance.now();
	if (e.data.msgType === 'cancel') {
		cancelMe = true;
		return;
	} else {
		cancelMe = false;
	}
	if (e.data.msgType != 'init')
		console.error(`Main Worker received unsupported msg type ${e.data.msgType}`);

	const init = e.data.payload as MainInit;
	const runCount = init.runCount;
	const workerCount = init.workerCount;
	const optimized = init.optimized;
	const workerPool = new Array<Worker>();
	for (let i = 0; i < workerCount; i++) {
		workerPool.push(new WorkerSub());
	}

	const runQueue = new Array<SubInit>();
	for (let i = 0; i < init.runCount; i++) {
		runQueue.push({
			workerNum: -1,
			runNumber: i,
			runDepth: init.runDepth
		} as SubInit);
	}

	let completed = 0;
	let subElapsed = 0;
	workerPool.forEach((sub) => {
		sub.onmessage = (msg: MessageEvent<SubMsg>): void => {
			switch (msg.data.msgType) {
				case 'status':
					self.postMessage({
						msgType: 'status',
						payload: msg.data.payload
					} as MainMsg);
					break;

				case 'sub-complete':
					const msgComplete = msg.data.payload as SubComplete;
					if (!cancelMe && optimized && runQueue.length > 0) {
						const nextInit = runQueue.shift();
						postSub(nextInit.runNumber, nextInit.runDepth, sub, msgComplete.workerNum);
					}

					self.postMessage(msg.data);
					completed++;
					subElapsed += msgComplete.elapsed;

					if (completed >= runCount || cancelMe) {
						self.postMessage({
							msgType: 'main-complete',
							payload: {
								runsCompleted: completed,
								runCount: runCount,
								elapsed: performance.now() - perf,
								subElapsed
							} as MainComplete
						} as MainMsg);
						workerPool.forEach((w) => w.terminate());
						workerPool.length = 0;
					}

					break;
			}
		};
	});

	if (optimized) {
		// fire off 1 run per worker to get things rolling
		for (let i = 0; i < init.workerCount; i++) {
			const subInit = runQueue.shift();
			const worker = workerPool[i];
			postSub(subInit.runNumber, subInit.runDepth, worker, i);
		}
	} else {
		// load up all of the runs evenly across workers right now
		let workerNum = 0;
		for (let j = 0; j < runCount; j++) {
			workerPool[workerNum].postMessage({
				msgType: 'init',
				payload: {
					workerNum,
					runNumber: j,
					runDepth: init.runDepth,
					subRunCount: Math.random() * 10
				} as SubInit
			} as SubMsg);

			workerNum++;
			if (workerNum >= workerCount) {
				workerNum = 0;
			}
		}
	}
};

const postSub = (runNumber: number, runDepth: number, worker: Worker, workerNum: number): void => {
	worker.postMessage({
		msgType: 'init',
		payload: {
			workerNum,
			runNumber,
			runDepth
		} as SubInit
	} as SubMsg);
};

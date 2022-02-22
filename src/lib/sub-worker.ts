declare var self: DedicatedWorkerGlobalScope;
import type { SubMsg, SubInit, Status, SubComplete } from '$lib/types';

const id = workerId();
console.log(`${id} created`)
let count = 0;

export default onmessage = (e: MessageEvent<SubMsg>) => {
	const perf = performance.now();
	if (e.data.msgType != 'init')
		console.error(`Sub Worker received unsupported msg type ${e.data.msgType}`);

	const init = e.data.payload as SubInit;
	console.log(`${id} in sub worker# ${init.workerNum}, run# ${init.runNumber}`);
	let completed = 0;
	let last = 0;
	for (let j = 0; j < init.runDepth; j++) {
		last = fib(last);
		completed++;
		self.postMessage({
			msgType: 'status',
			payload: {
				workerNum: init.workerNum,
				runNumber: init.runNumber,
				percent: (j / init.runDepth) * 100,
				text: `sub ${init.workerNum} working main run ${init.runNumber}, sub run ${j}/${init.runDepth}, answer is ${last}`
			} as Status
		} as SubMsg);
	}

	count ++;
	//console.log(`   in sub worker# ${init.workerNum}, run# ${init.mainRunNumber}, sending complete`);
	self.postMessage({
		msgType: 'sub-complete',
		payload: {
			workerNum: init.workerNum,
			runNumber: init.runNumber,
			subRunsCompleted: completed,
			subRunsCount: init.runDepth,
			elapsed: performance.now() - perf
		} as SubComplete
	} as SubMsg);
};

function workerId(): string {
	const n1 = (Math.random() * 46656) | 0;
	const n2 = (Math.random() * 46656) | 0;
	const s1 = ('000' + n1.toString(36)).slice(-3);
	const s2 = ('000' + n2.toString(36)).slice(-3);
	return 'w-' + s1 + s2;
}

const fib = (n) => {
	if (n < 2) {
		return n; // or 1
	} else {
		return fib(n - 1) + fib(n - 2);
	}
};


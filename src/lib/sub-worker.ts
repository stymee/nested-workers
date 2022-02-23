declare var self: DedicatedWorkerGlobalScope;
import type { SubMsg, SubInit, Status, SubComplete } from '$lib/types';

const id = workerId();
console.log(`sub worker ${id} created`);

export default onmessage = (e: MessageEvent<SubMsg>) => {
	const perf = performance.now();
	if (e.data.msgType != 'init')
		console.error(`Sub Worker received unsupported msg type ${e.data.msgType}`);

	const init = e.data.payload as SubInit;

	let runDepth = init.runDepth * 1_000_000;
	let runPartial = getPartial(init.runNumber);
	let runAdd = runDepth * runPartial;
	runDepth += runAdd;

	let statusInterval = 0.01;
	let nextStatus = statusInterval;
	let lastFib = 0;

	for (let j = 0; j < runDepth; j++) {
		// recompute fib
		lastFib = fib(lastFib);
		const percent = j / runDepth;
		if (percent > nextStatus) {
			nextStatus += statusInterval;
			self.postMessage({
				msgType: 'status',
				payload: {
					workerNum: init.workerNum,
					runNumber: init.runNumber,
					percent: percent * 100,
					text: `sub ${init.workerNum} working main run ${init.runNumber}, sub run ${j}/${init.runDepth}, answer is ${lastFib}`
				} as Status
			} as SubMsg);
		}
	}

	self.postMessage({
		msgType: 'sub-complete',
		payload: {
			workerNum: init.workerNum,
			runNumber: init.runNumber,
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

// recursive fibonacci function just for cpu burn
const fib = (n: number) => {
	if (n < 2) {
		return n; // or 1
	} else {
		return fib(n - 1) + fib(n - 2);
	}
};

const getPartial = (n: number): number => {
	// sorta random assortment of multipliers to give some  so I can compare runs
	// probably a better way to accomplish this
	const check = [
		1.0, //1
		1.4, //2
		1.8, //3
		0.7, //4
		0.6, //5
		0.4, //6
		1.3, //7
		1.2, //8
		0.7, //9
		0.9, //10
		1.5, //1
		1.1, //2
		0.4, //3
		0.6, //4
		0.7, //5
		1.7, //6
		1.1, //7
		1.0, //8
		0.8, //9
		0.5, //20
	];

	let checkN = n;
	while (checkN >= check.length) {
		checkN -= check.length;
	}
	return check[checkN];
}

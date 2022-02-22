declare var self: DedicatedWorkerGlobalScope;
import type { SubMsg, SubInit, Status, SubComplete } from '$lib/types';

const id = workerId();
console.log(`${id} created`);
let count = 0;

export default onmessage = (e: MessageEvent<SubMsg>) => {
	const perf = performance.now();
	if (e.data.msgType != 'init')
		console.error(`Sub Worker received unsupported msg type ${e.data.msgType}`);

	const init = e.data.payload as SubInit;
	console.log(`${id} in sub worker# ${init.workerNum}, run# ${init.runNumber}`);

	let runDepth = init.runDepth * 1_000_000;
	let runPartial = getPartial(init.runNumber);
	let runAdd = runDepth * runPartial;
	runDepth += runAdd;
	let statusInterval = 0.01;
	let nextStatus = statusInterval;
	let lastFib = 0;
	for (let j = 0; j < runDepth; j++) {
		lastFib = fib(lastFib);
		//completed++;
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

	count++;
	const elapsed = performance.now() - perf;
	console.log(
		`   in sub worker# ${init.workerNum}, run# ${
			init.runNumber
		}, sending complete in ${elapsed.toFixed(3)}ms`
	);
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

const fib = (n: number) => {
	if (n < 2) {
		return n; // or 1
	} else {
		return fib(n - 1) + fib(n - 2);
	}
};

const getPartial = (n: number): number => {
	const check = [
		1.0, //1
		1.2, //2
		1.5, //3
		0.8, //4
		0.7, //5
		0.5, //6
		1.3, //7
		1.4, //8
		0.8, //9
		0.9, //10
		1.3, //1
		1.1, //2
		0.5, //3
		0.8, //4
		0.7, //5
		1.5, //6
		1.1, //7
		1.0, //8
		0.6, //9
		0.4, //20
	];

	if (n < check.length) {
		return check[n];
	} else {
		return check[n-check.length];
	}
}

declare var self: DedicatedWorkerGlobalScope;
import type { SubMsg, SubInit, Status, SubComplete } from '$lib/types';

export default onmessage = async (e: MessageEvent<SubMsg>) => {
	const perf = performance.now();
	if (e.data.msgType != 'init')
		console.error(`Sub Worker received unsupported msg type ${e.data.msgType}`);

	const init = e.data.payload as SubInit;
	//console.log(`in sub worker# ${init.workerNum}, run# ${init.mainRunNumber}`);
	const time = Math.random() * 1000;
	let completed = 0;
	for (let j = 0; j < init.subRunCount; j++) {
		await timeout(time);
		completed++;
		//console.log(`   in sub worker# ${init.workerNum}, run# ${init.mainRunNumber}, sending ${j}`);
		self.postMessage({
			msgType: 'status',
			payload: {
				workerNum: init.workerNum,
				runNumber: init.mainRunNumber,
				percent: (j / init.subRunCount) * 100,
				text: `sub ${init.workerNum} working main run ${init.mainRunNumber}, sub run ${j}/${init.subRunCount}`
			} as Status
		} as SubMsg);
	}

	//console.log(`   in sub worker# ${init.workerNum}, run# ${init.mainRunNumber}, sending complete`);
	self.postMessage({
		msgType: 'sub-complete',
		payload: {
			workerNum: init.workerNum,
			mainRunNumber: init.mainRunNumber,
			subRunsCompleted: completed,
			subRunsCount: init.subRunCount,
			elapsed: performance.now() - perf
		} as SubComplete
	} as SubMsg);
};

function timeout(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

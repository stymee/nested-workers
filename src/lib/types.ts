export type State = 'ready' | 'active' | 'complete';

export type Run = {
	workerNum: number;
	runNumber: number;
	state: State;
	percent: number;
	elapsed: number;
	text: string;
};

export type Sub = {
	workerNum: number;
	runNumber: number;
	percent: number;
	totalElapsed: number;
	runCount: number;
	text: string;
}

export type Status = {
	workerNum: number;
	runNumber: number;
	percent: number;
	text: string;
};

export type MsgType = 'init' | 'main-complete' | 'sub-complete' | 'status';

export type MainInit = {
	workerCount: number;
	runCount: number;
	runDepth: number;
};

export type MainComplete = {
	runNumber: number;
	runsCompleted: number;
	runCount: number;
	elapsed: number;
	subElapsed: number;
};

export type MainMsg = {
	msgType: MsgType;
	payload: MainInit | MainComplete | SubComplete | Status;
};

export type SubInit = {
	workerNum: number;
	runNumber: number;
	runDepth: number;
};

export type SubComplete = {
	workerNum: number;
	runNumber: number;
	elapsed: number;
};

export type SubMsg = {
	msgType: MsgType;
	payload: SubInit | SubComplete | Status;
};

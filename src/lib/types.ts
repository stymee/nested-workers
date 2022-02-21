export type Run = {
	workerNum: number;
	runNumber: number;
	percent: number;
	elapsed: number;
	text: string;
	count: number;
};

export type Status = {
	workerNum: number;
	runNumber: number;
	percent: number;
	text: string;
};

export type MsgType = 'init' | 'main-complete' | 'sub-complete' | 'status';

export type MainInit = {
	workerCount: number;
	mainRunCount: number;
};

export type MainComplete = {
	mainRunNumber: number;
	mainRunsCompleted: number;
	mainRunCount: number;
	elapsed: number;
	subElapsed: number;
};

export type MainMsg = {
	msgType: MsgType;
	payload: MainInit | MainComplete | SubComplete | Status;
};

export type SubInit = {
	workerNum: number;
	mainRunNumber: number;
	subRunCount: number;
};

export type SubComplete = {
	workerNum: number;
	mainRunNumber: number;
	subRunsCompleted: number;
	subRunsCount: number;
	elapsed: number;
};

export type SubMsg = {
	msgType: MsgType;
	payload: SubInit | SubComplete | Status;
};

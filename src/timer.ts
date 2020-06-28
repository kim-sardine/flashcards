import * as vscode from 'vscode';

class Timer {
	private timeChangedEventEmitter = new vscode.EventEmitter<TimeChangedEventArgs>();
​
	private elapsedSeconds: number = 0;
	private interval: NodeJS.Timer | undefined;

	private displaySeconds: number;

	constructor(timerTimeInterval: number) {
		this.displaySeconds = timerTimeInterval;
		this.start();
	}

	get onTimeChanged(): vscode.Event<TimeChangedEventArgs> {
		return this.timeChangedEventEmitter.event;
	}
​
	private fireTimeChangedEvent(): void {
		const args: TimeChangedEventArgs = {
		};
		this.timeChangedEventEmitter.fire(args);
	}

	private tick() {		
		this.elapsedSeconds += 1;
		if (this.elapsedSeconds >= this.displaySeconds) {
			this.elapsedSeconds = 0;
            this.fireTimeChangedEvent();
		}
	}

	private start() {
		this.interval = setInterval(() => {
			this.tick();
		}, 1000);
	}
	
}


interface TimeChangedEventArgs {
}
​
export default Timer;

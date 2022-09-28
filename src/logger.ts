export class Logger {
	constructor(private readonly name: string) {}

	get messagePrelude() {
		return `[${this.name}]`;
	}

	nest(name: string) {
		return new Logger(`${this.name}:${name}`);
	}

	log(...message: any[]) {
		console.log(this.messagePrelude, ...message);
	}

	error(...message: any[]) {
		console.error(this.messagePrelude, ...message);
	}
}

const logger = new Logger('fish-completion');
export default logger;

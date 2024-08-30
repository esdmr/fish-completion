import {window} from 'vscode';
import {output} from './output.js';

const labelForShowOutput = 'Show output';

export class Message {
	#hasBeenShown = false;

	constructor(
		readonly type: 'error' | 'info',
		readonly message: string,
	) {}

	async show(additionalMessage?: string) {
		const message =
			this.message + (additionalMessage ? ': ' + additionalMessage : '.');

		this.#hasBeenShown = true;

		const selection = await (this.type === 'error'
			? window.showErrorMessage(message, labelForShowOutput)
			: window.showInformationMessage(message));

		if (selection === labelForShowOutput) {
			output.show();
		}
	}

	async showOnce() {
		if (!this.#hasBeenShown) {
			await this.show();
		}
	}

	forget() {
		this.#hasBeenShown = false;
	}
}

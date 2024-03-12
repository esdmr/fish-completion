import type {ExtensionContext} from 'vscode';
import {registerUpdateCompletionsCommand} from './commands/update-completions.js';
import {disposables} from './disposables.js';
import {output} from './output.js';
import {registerCompletionProvider} from './providers/completion.js';
import {checkPlatformSupport} from './fish/worker.js';
import {Message} from './message.js';

const cannotBeActivatedMessage = new Message(
	'error',
	'Fish completions cannot be activated',
);

export function activate(_context: ExtensionContext) {
	const reason = checkPlatformSupport();

	if (reason) {
		void cannotBeActivatedMessage.show(reason);
		deactivate();
		return;
	}

	output.info('Activated');

	registerCompletionProvider();
	registerUpdateCompletionsCommand();
}

export function deactivate() {
	output.info('Deactivated');

	for (const item of disposables) {
		item.dispose();
	}

	disposables.clear();
}

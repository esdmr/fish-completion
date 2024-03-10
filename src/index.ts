import vscode from 'vscode';
import {registerUpdateCompletionsCommand} from './commands/update-completions.js';
import {disposables} from './disposables.js';
import {output} from './output.js';
import {registerCompletionProvider} from './providers/completion.js';
import {checkPlatformSupport} from './fish/worker.js';

export function activate(_context: vscode.ExtensionContext) {
	const reason = checkPlatformSupport();

	if (reason) {
		void vscode.window.showErrorMessage(
			'Fish completions cannot be activated: ' + reason,
		);
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

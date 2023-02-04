import type {ExtensionContext} from 'vscode';
import {registerUpdateCompletionsCommand} from './commands/update-completions.js';
import {disposables} from './disposables.js';
import {output} from './output.js';
import {registerCompletionProvider} from './providers/completion.js';

export function activate(_context: ExtensionContext) {
	output.appendLine('Activated');

	registerCompletionProvider();
	registerUpdateCompletionsCommand();
}

export function deactivate() {
	output.appendLine('Deactivated');

	for (const item of disposables) {
		item.dispose();
	}
}

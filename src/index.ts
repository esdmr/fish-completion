import {rmSync} from 'node:fs';
import {dirname} from 'node:path';
import vscode from 'vscode';
import {vscodeAbortController} from './abort.js';
import {completeCommand, temporaryDir, updateCompletions} from './fish.js';

const disposables = new Set<vscode.Disposable>();
const output = vscode.window.createOutputChannel('Fish Completion');
disposables.add(output);

export function activate(_context: vscode.ExtensionContext) {
	output.appendLine('Activated');

	disposables.add(vscode.languages.registerCompletionItemProvider('fish', {
		async provideCompletionItems(document, position, token) {
			if (token.isCancellationRequested) {
				return;
			}

			const {signal, dispose} = vscodeAbortController(token);

			try {
				const text = document.getText(new vscode.Range(new vscode.Position(0, 0), position));

				const {completions, currentToken} = await completeCommand({
					cwd: dirname(document.uri.fsPath),
					text,
					output,
					signal,
				});

				return completions.map(item => {
					const [type, label = '', ...parts] = item.split('\t');
					let kind;

					switch (type) {
						case 'File':
							kind = vscode.CompletionItemKind.File;
							break;

						case 'Folder':
							kind = vscode.CompletionItemKind.Folder;
							break;

						case 'Keyword':
							kind = vscode.CompletionItemKind.Keyword;
							break;

						case 'Function':
							kind = vscode.CompletionItemKind.Function;
							break;

						case 'Variable':
							kind = vscode.CompletionItemKind.Variable;
							break;

						default:
							kind = vscode.CompletionItemKind.Text;
					}

					const completion = new vscode.CompletionItem({
						label,
						description: parts.join('\t'),
					}, kind);

					completion.range = new vscode.Range(position.translate(0, -currentToken.length), position);

					return completion;
				});
			} catch (error) {
				output.appendLine('Error: ' + String(error));
				throw error;
			} finally {
				dispose();
			}
		},
	}));

	disposables.add(vscode.commands.registerCommand('fish-completion.fish_update_completions', () => vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		cancellable: true,
		title: 'Updating fish completions',
	}, async (progress, token) => {
		const {signal, dispose} = vscodeAbortController(token);

		progress.report({
			increment: 0,
		});

		let currentProgress = 0;

		try {
			await updateCompletions({
				output,
				signal,
				callback(state) {
					const percentage = state.progress / state.total * 100;

					progress.report({
						increment: percentage - currentProgress,
						message: `${state.progress}/${state.total} - ${state.current}`,
					});

					currentProgress = percentage;
				},
			});
		} catch (error) {
			const string = String(error);

			if (string.includes('AbortError')) {
				output.appendLine('Aborted');
				return;
			}

			output.appendLine('Error: ' + string);

			void vscode.window.showErrorMessage('Something gone wrong while updating fish completions.');
		} finally {
			dispose();
		}
	})));
}

export function deactivate() {
	output.appendLine('Deactivated');

	for (const item of disposables) {
		item.dispose();
	}

	rmSync(temporaryDir, {force: true, recursive: true});
}

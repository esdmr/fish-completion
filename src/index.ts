import {rmSync} from 'node:fs';
import {dirname} from 'node:path';
import vscode from 'vscode';
import {vscodeAbortController} from './abort.js';
import {completeCommand, temporaryDir} from './fish.js';

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
}

export function deactivate() {
	output.appendLine('Deactivated');

	for (const item of disposables) {
		item.dispose();
	}

	rmSync(temporaryDir, {force: true, recursive: true});
}

import {dirname} from 'node:path';
import {createInterface} from 'node:readline';
import {fileURLToPath} from 'node:url';
import {execa} from 'execa';
import vscode from 'vscode';

const disposables = new Set<vscode.Disposable>();
const fishScript = `fish -iC 'source (string unescape --style url -- "${encodeURIComponent(fileURLToPath(new URL('worker.fish', import.meta.url)))}")'`;
const output = vscode.window.createOutputChannel('Fish Completion');
disposables.add(output);

export function activate(_context: vscode.ExtensionContext) {
	output.appendLine('Activated');

	disposables.add(vscode.languages.registerCompletionItemProvider('fish', {
		async provideCompletionItems(document, position, token) {
			if (token.isCancellationRequested) {
				return;
			}

			const text = document.getText(new vscode.Range(new vscode.Position(0, 0), position));

			let currentToken = '';
			const completions: string[] = [];

			const child = execa('script', ['-e', '-q', '-c', fishScript, '/dev/null'], {
				stdio: [
					'pipe', // 0 stdin
					'pipe', // 1 stdout
					'pipe', // 2 stderr
					'pipe', // 3 unused
					'pipe', // 4 unused
					'pipe', // 5 unused
					'pipe', // 6 unused
					'pipe', // 7 unused
					'pipe', // 8 unused
					'pipe', // 9 output
				],
				cwd: dirname(document.uri.fsPath),
				env: {
					/* eslint-disable @typescript-eslint/naming-convention */
					TERM: 'dumb',
					GIO_LAUNCHED_DESKTOP_FILE: undefined,
					VISUAL: undefined,
					CHROME_DESKTOP: undefined,
					VSCODE_GIT_ASKPASS_NODE: undefined,
					VSCODE_GIT_ASKPASS_MAIN: undefined,
					TERM_PROGRAM: undefined,
					GIT_ASKPASS: undefined,
					VSCODE_GIT_IPC_HANDLE: undefined,
					EDITOR: undefined,
					VSCODE_GIT_ASKPASS_EXTRA_ARGS: undefined,
					/* eslint-enable @typescript-eslint/naming-convention */
				},
				timeout: 10_000,
			});
			const rl = createInterface((child.stdio as any[])[9]);

			output.appendLine('Request: ' + text.slice(text.lastIndexOf('\n') + 1));

			rl.on('line', line => {
				output.appendLine('Line: ' + line);
				if (line.includes('ready')) {
					child.stdin!.write(`_vscode_complete "${encodeURIComponent(text)}"\n`);
				} else if (line.startsWith('complete ')) {
					completions.push(line.slice('complete '.length));
				} else if (line.startsWith('current ')) {
					currentToken = line.slice('current '.length);
				}
			});

			rl.resume();

			try {
				await child;
			} catch (error) {
				output.appendLine('Error: ' + String(error));

				if (String(error).includes('Command failed')) {
					return [];
				}

				throw error;
			}

			output.appendLine('Done');
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
		},
	}));
}

export function deactivate() {
	output.appendLine('Deactivated');

	for (const item of disposables) {
		item.dispose();
	}
}

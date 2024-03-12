import {dirname} from 'node:path';
import vscode from 'vscode';
import {vscodeAbortController} from '../abort.js';
import {getAssistantResult} from '../assistant.js';
import {getFishPath, isAssistantEnabled} from '../config.js';
import {disposables} from '../disposables.js';
import {
	completeCommand,
	type ParsedCompletionItem,
} from '../fish/complete-command.js';
import {output} from '../output.js';
import {Message} from '../message.js';

const startOfDocument = new vscode.Position(0, 0);
const failureMessage = new Message(
	'error',
	'Something gone wrong while fetching completions',
);

const completionProvider: vscode.CompletionItemProvider = {
	async provideCompletionItems(document, position, token) {
		if (token.isCancellationRequested) {
			return;
		}

		const {signal, dispose} = vscodeAbortController(token);

		try {
			const assistantCommands = isAssistantEnabled(document)
				? getAssistantResult(document).getCommands()
				: '';

			const text = document.getText(
				new vscode.Range(startOfDocument, position),
			);

			const {completions, currentToken} = await completeCommand({
				cwd: dirname(document.uri.fsPath),
				fishPath: getFishPath(document),
				assistantCommands,
				text,
				output,
				signal,
			});

			const range = new vscode.Range(
				position.translate(0, -currentToken.length),
				position,
			);

			failureMessage.forget();
			return completions.map((i) => getCompletionItem(i, range));
		} catch (error) {
			const string = String(error);

			if (string.includes('AbortError')) {
				output.warn('Aborted');
				return;
			}

			output.error('Error: ' + string);
			void failureMessage.showOnce();
			throw error;
		} finally {
			dispose();
		}
	},
};

function getCompletionItem(
	{kind, label, description}: ParsedCompletionItem,
	range: vscode.Range,
) {
	const completion = new vscode.CompletionItem(
		{label, description},
		getCompletionKind(kind),
	);

	completion.range = range;

	return completion;
}

function getCompletionKind(
	type: string | undefined,
): vscode.CompletionItemKind {
	switch (type) {
		case 'File': {
			return vscode.CompletionItemKind.File;
		}

		case 'Folder': {
			return vscode.CompletionItemKind.Folder;
		}

		case 'Keyword': {
			return vscode.CompletionItemKind.Keyword;
		}

		case 'Function': {
			return vscode.CompletionItemKind.Function;
		}

		case 'Variable': {
			return vscode.CompletionItemKind.Variable;
		}

		default: {
			return vscode.CompletionItemKind.Text;
		}
	}
}

export function registerCompletionProvider() {
	disposables.add(
		vscode.languages.registerCompletionItemProvider(
			'fish',
			completionProvider,
		),
	);
}

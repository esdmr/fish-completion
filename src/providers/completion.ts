import {dirname} from 'node:path';
import vscode from 'vscode';
import {vscodeAbortController} from '../abort.js';
import {getAssistantResult} from '../assistant.js';
import {getFishPath, isAssistantEnabled} from '../config.js';
import {disposables} from '../disposables.js';
import {completeCommand} from '../fish/complete-command.js';
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
				signal,
			});

			return completions.map((item) => {
				const [type, label = '', ...parts] = item.split('\t');
				const kind = getCompletionKind(type);

				return getCompletionItem({
					label,
					description: parts.join('\t'),
					kind,
					position,
			failureMessage.forget();
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

function getCompletionItem(options: {
	label: string;
	description: string;
	kind: vscode.CompletionItemKind;
	position: vscode.Position;
	currentToken: string;
}) {
	const completion = new vscode.CompletionItem(
		{
			label: options.label,
			description: options.description,
		},
		options.kind,
	);

	completion.range = new vscode.Range(
		options.position.translate(0, -options.currentToken.length),
		options.position,
	);

	return completion;
}

function getCompletionKind(type: string | undefined) {
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

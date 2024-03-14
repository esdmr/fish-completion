import {dirname} from 'node:path';
import {
	Position,
	type CompletionItemProvider,
	Range,
	CompletionItem,
	CompletionItemKind,
	languages,
} from 'vscode';
import {vscodeAbortController} from '../utils/abort.js';
import {getAssistantResult} from '../assistant.js';
import {getFishPath, isAssistantEnabled} from '../utils/config.js';
import {disposables} from '../utils/disposables.js';
import {
	completeCommand,
	type ParsedCompletionItem,
} from '../fish/complete-command.js';
import {output} from '../utils/output.js';
import {Message} from '../utils/message.js';

const startOfDocument = new Position(0, 0);
const failureMessage = new Message(
	'error',
	'Something gone wrong while fetching completions',
);

const completionProvider: CompletionItemProvider = {
	async provideCompletionItems(document, position, token) {
		if (token.isCancellationRequested) {
			return;
		}

		const {signal, dispose} = vscodeAbortController(token);

		try {
			const assistantCommands = isAssistantEnabled(document)
				? getAssistantResult(document).getCommands()
				: '';

			const text = document.getText(new Range(startOfDocument, position));

			const {completions, currentToken} = await completeCommand({
				cwd: dirname(document.uri.fsPath),
				fishPath: getFishPath(document),
				assistantCommands,
				text,
				output,
				signal,
			});

			const range = new Range(
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
	range: Range,
) {
	const completion = new CompletionItem(
		{label, description},
		getCompletionKind(kind),
	);

	completion.range = range;

	return completion;
}

function getCompletionKind(type: string | undefined): CompletionItemKind {
	switch (type) {
		case 'File': {
			return CompletionItemKind.File;
		}

		case 'Folder': {
			return CompletionItemKind.Folder;
		}

		case 'Keyword': {
			return CompletionItemKind.Keyword;
		}

		case 'Function': {
			return CompletionItemKind.Function;
		}

		case 'Variable': {
			return CompletionItemKind.Variable;
		}

		default: {
			return CompletionItemKind.Text;
		}
	}
}

export function registerCompletionProvider() {
	disposables.add(
		languages.registerCompletionItemProvider('fish', completionProvider),
	);
}

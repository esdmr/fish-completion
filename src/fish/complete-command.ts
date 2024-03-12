import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import type {LogOutputChannel} from 'vscode';
import {startWorker, temporaryDirectory} from './worker.js';

const textFile = join(temporaryDirectory, 'text');
const commandFile = join(temporaryDirectory, 'cmd');

export type ParsedCompletionItem = {
	kind: string;
	label: string;
	description: string;
};

export async function completeCommand(options: {
	cwd: string;
	fishPath: string;
	assistantCommands: string;
	text: string;
	output?: LogOutputChannel | undefined;
	signal?: AbortSignal | undefined;
}) {
	options.output?.info('Requesting for completions');

	await Promise.all([
		writeFile(textFile, options.text),
		writeFile(commandFile, options.assistantCommands),
	]);

	try {
		let currentToken = '';

		const completions: ParsedCompletionItem[] = [];

		for await (const line of startWorker({
			cwd: options.cwd,
			fishPath: options.fishPath,
			keyBind: 'e',
			isAssistantEnabled: options.assistantCommands !== '',
			signal: options.signal,
			output: options.output,
		})) {
			if (line.startsWith('complete ')) {
				const [kind = '', label = '', ...parts] = line
					.slice('complete '.length)
					.split('\t');

				completions.push({
					kind,
					label,
					description: parts.join('\t'),
				});
			} else if (line.startsWith('current ')) {
				currentToken = line.slice('current '.length);
			}
		}

		return {completions, currentToken};
	} finally {
		await Promise.all([
			writeFile(textFile, ''),
			writeFile(commandFile, ''),
		]);
	}
}

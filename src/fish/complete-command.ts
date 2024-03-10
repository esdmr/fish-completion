import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createInterface} from 'node:readline';
import {output} from '../output.js';
import {debugStdOutputAndError, startWorker, temporaryDir} from './worker.js';

export async function completeCommand(options: {
	cwd: string;
	fishPath: string;
	assistantCommands: string;
	text: string;
	signal: AbortSignal;
}) {
	await writeFile(join(temporaryDir, 'text'), options.text, 'utf8');

	await writeFile(
		join(temporaryDir, 'cmd'),
		options.assistantCommands,
		'utf8',
	);

	let currentToken = '';
	const completions: string[] = [];

	const {child, inputChannel, outputChannel} = startWorker({
		cwd: options.cwd,
		isAssistantEnabled: options.assistantCommands !== '',
		fishPath: options.fishPath,
		signal: options.signal,
	});

	const rl = createInterface(outputChannel);

	output.info(
		'Request: ' + options.text.slice(options.text.lastIndexOf('\n') + 1),
	);

	rl.on('line', (line) => {
		if (!line.trim()) {
			return;
		}

		output.trace('Line: ' + line);

		if (line.includes('ready')) {
			inputChannel.write('e');
		} else if (line.startsWith('complete ')) {
			completions.push(line.slice('complete '.length));
		} else if (line.startsWith('current ')) {
			currentToken = line.slice('current '.length);
		}
	});

	rl.resume();
	debugStdOutputAndError(child, output);

	try {
		await child;
	} catch (error) {
		if (String(error).includes('Command failed')) {
			output.error('Failure: ' + String(error));

			return {completions: [], currentToken};
		}

		throw error;
	} finally {
		await writeFile(join(temporaryDir, 'text'), '', 'utf8');
		await writeFile(join(temporaryDir, 'cmd'), '', 'utf8');
	}

	output.info('Done');
	return {completions, currentToken};
}

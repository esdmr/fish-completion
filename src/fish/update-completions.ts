import {createInterface} from 'node:readline';
import {output} from '../output.js';
import {debugStdOutputAndError, startWorker} from './worker.js';

export async function updateCompletions(options: {
	fishPath: string;
	signal?: AbortSignal;
	callback: (state: {
		readonly progress: number;
		readonly total: number;
		readonly current: string;
	}) => void;
}) {
	const state = {
		progress: 0,
		total: 1,
		current: 'Updating…',
	};

	const {child, inputChannel, outputChannel} = startWorker({
		cwd: '/',
		fishPath: options.fishPath,
		signal: options.signal,
		timeout: 500_000,
	});

	const rl = createInterface(outputChannel);
	output.info('Updating completions');

	rl.on('line', (line) => {
		if (!line.trim()) {
			return;
		}

		output.trace('Line: ' + line);

		if (line.includes('ready')) {
			inputChannel.write('u');
			return;
		}

		const match =
			/^\s*(?<progress>\d+)\s*\/\s*(?<total>\d+)\s*:\s*(?<current>.+?)\s*$/.exec(
				line,
			);

		if (!match) {
			return;
		}

		state.progress = Number(match.groups?.progress);
		state.total = Number(match.groups?.total);
		state.current = String(match.groups?.current);

		options.callback(state);
	});

	rl.resume();
	debugStdOutputAndError(child, output);

	try {
		await child;
	} catch (error) {
		if (String(error).includes('Command failed')) {
			output.error('Failure: ' + String(error));
			return;
		}

		throw error;
	}

	output.info('Done');
}

import type {LogOutputChannel} from 'vscode';
import {startWorker} from './worker.js';

export async function* updateCompletions(options: {
	fishPath: string;
	output?: LogOutputChannel | undefined;
	signal?: AbortSignal | undefined;
}) {
	options.output?.info('Updating completions');

	const state = {
		progress: 0,
		total: 1,
		current: 'Updating…',
	};

	for await (const line of startWorker({
		cwd: '/',
		fishPath: options.fishPath,
		keyBind: 'u',
		signal: options.signal,
		timeout: 500_000,
		output: options.output,
	})) {
		const match =
			/^\s*(?<progress>\d+)\s*\/\s*(?<total>\d+)\s*:\s*(?<current>.+?)\s*$/.exec(
				line,
			);

		if (!match) {
			continue;
		}

		state.progress = Number(match.groups?.progress);
		state.total = Number(match.groups?.total);
		state.current = String(match.groups?.current);

		yield state;
	}
}

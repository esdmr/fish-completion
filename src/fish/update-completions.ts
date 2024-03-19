import type {LogOutputChannel} from 'vscode';
import {startWorker} from './worker.js';

export async function* updateCompletions(options: {
	readonly fishPath: string;
	readonly output?: LogOutputChannel | undefined;
	readonly signal?: AbortSignal | undefined;
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
			/^\s*(?<progress>\d+)\s*\/\s*(?<total>\d+)\s*:(?<current>.*)$/.exec(
				line,
			);

		if (!match) {
			continue;
		}

		state.progress = Number(match.groups?.progress);
		state.total = Number(match.groups?.total);
		state.current = String(match.groups?.current).trim();

		yield state as Readonly<typeof state>;
	}
}

import {createInterface} from 'node:readline';
import {fileURLToPath} from 'node:url';
import {writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import type {Readable} from 'node:stream';
import {mkdtempSync} from 'node:fs';
import {execa, type ExecaChildProcess} from 'execa';
import type {OutputChannel} from 'vscode';

export const temporaryDir = mkdtempSync(join(tmpdir(), 'fish-completion-'));

function startWorker(options: {
	cwd: string;
	signal?: AbortSignal | undefined;
	timeout?: number;
}) {
	const child = execa(
		'script',
		[
			'-e',
			'-q',
			'-c',
			"fish -iPC 'set -g _dir $_FISH_COMPLETION_TEMP_DIR; source $_FISH_COMPLETION_WORKER'",
			'/dev/null',
		],
		{
			stdio: [
				'pipe', // 0 stdin
				'pipe', // 1 stdout
				'pipe', // 2 stderr
				'ignore', // 3 unused
				'ignore', // 4 unused
				'ignore', // 5 unused
				'ignore', // 6 unused
				'ignore', // 7 unused
				'ignore', // 8 unused
				'pipe', // 9 output
			],
			cwd: options.cwd,
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
				_FISH_COMPLETION_TEMP_DIR: temporaryDir,
				_FISH_COMPLETION_WORKER: fileURLToPath(
					new URL('worker.fish', import.meta.url),
				),
				/* eslint-enable @typescript-eslint/naming-convention */
			},
			timeout: options.timeout ?? 10_000,
			signal: options.signal!,
		},
	);

	return {
		child,
		inputChannel: child.stdin!,
		outputChannel: (child.stdio as Readable[])[9]!,
	};
}

function debugStdOutputAndError(
	child: ExecaChildProcess,
	output: OutputChannel,
) {
	for (const channel of ['stdout', 'stderr'] as const) {
		const rl = createInterface(child[channel]!);

		rl.on('line', (line) => {
			output.appendLine(channel + ': ' + line);
		});

		rl.resume();
	}
}

export async function completeCommand(options: {
	cwd: string;
	text: string;
	output: OutputChannel;
	signal: AbortSignal;
}) {
	await writeFile(join(temporaryDir, 'text'), options.text, 'utf8');

	let currentToken = '';
	const completions: string[] = [];

	const {child, inputChannel, outputChannel} = startWorker({
		cwd: options.cwd,
		signal: options.signal,
	});

	const rl = createInterface(outputChannel);

	options.output.appendLine(
		'Request: ' + options.text.slice(options.text.lastIndexOf('\n') + 1),
	);

	rl.on('line', (line) => {
		if (!line.trim()) {
			return;
		}

		options.output.appendLine('Line: ' + line);

		if (line.includes('ready')) {
			inputChannel.write('e');
		} else if (line.startsWith('complete ')) {
			completions.push(line.slice('complete '.length));
		} else if (line.startsWith('current ')) {
			currentToken = line.slice('current '.length);
		}
	});

	rl.resume();
	debugStdOutputAndError(child, options.output);

	try {
		await child;
	} catch (error) {
		if (String(error).includes('Command failed')) {
			options.output.appendLine('Failure: ' + String(error));

			return {completions: [], currentToken};
		}

		throw error;
	} finally {
		await writeFile(join(temporaryDir, 'text'), '', 'utf8');
	}

	options.output.appendLine('Done');
	return {completions, currentToken};
}

export async function updateCompletions(options: {
	output: OutputChannel;
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
		signal: options.signal,
		timeout: 500_000,
	});

	const rl = createInterface(outputChannel);
	options.output.appendLine('Updating completions');

	rl.on('line', (line) => {
		if (!line.trim()) {
			return;
		}

		options.output.appendLine('Line: ' + line);

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
	debugStdOutputAndError(child, options.output);

	try {
		await child;
	} catch (error) {
		if (String(error).includes('Command failed')) {
			options.output.appendLine('Failure: ' + String(error));
			return;
		}

		throw error;
	}

	options.output.appendLine('Done');
}

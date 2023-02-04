import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createInterface} from 'node:readline';
import type {Readable} from 'node:stream';
import {fileURLToPath} from 'node:url';
import {execa, type ExecaChildProcess} from 'execa';
import vscode from 'vscode';
import {disposables} from '../disposables.js';

export const temporaryDir = mkdtempSync(join(tmpdir(), 'fish-completion-'));

disposables.add(
	new vscode.Disposable(() => {
		rmSync(temporaryDir, {force: true, recursive: true});
	}),
);

const safePath = /^(\/[\w.-]+)+$/;

export function startWorker(options: {
	cwd: string;
	fishPath: string;
	signal?: AbortSignal | undefined;
	timeout?: number;
}) {
	if (!safePath.test(options.fishPath)) {
		options.fishPath = 'fish';
	}

	const child = execa(
		'script',
		[
			'-e',
			'-q',
			'-c',
			`${options.fishPath} -iPC 'set -g _dir $_FISH_COMPLETION_TEMP_DIR; source $_FISH_COMPLETION_WORKER'`,
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

export function debugStdOutputAndError(
	child: ExecaChildProcess,
	output: vscode.OutputChannel,
) {
	for (const channel of ['stdout', 'stderr'] as const) {
		const rl = createInterface(child[channel]!);

		rl.on('line', (line) => {
			output.appendLine(channel + ': ' + line);
		});

		rl.resume();
	}
}

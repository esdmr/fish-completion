import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {platform} from 'node:process';
import {createInterface} from 'node:readline';
import type {Readable} from 'node:stream';
import {fileURLToPath} from 'node:url';
import {execa, type ExecaChildProcess} from 'execa';
import vscode from 'vscode';
import {disposables} from '../disposables.js';

export const temporaryDirectory = mkdtempSync(
	join(tmpdir(), 'fish-completion-'),
);

disposables.add(
	new vscode.Disposable(() => {
		rmSync(temporaryDirectory, {force: true, recursive: true});
	}),
);

const safePath = /^(?:\/[\w.-]+)+$|^[\w.-]+$/;

export function startWorker(options: {
	cwd: string;
	isAssistantEnabled?: boolean;
	fishPath: string;
	signal?: AbortSignal | undefined;
	timeout?: number;
}) {
	if (!safePath.test(options.fishPath)) {
		options.fishPath = 'fish';
	}

	const command = getCommand(options.fishPath);
	const child = execa(command[0], command.slice(1), {
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
			_FISH_COMPLETION_ASSIST: options.isAssistantEnabled
				? 'v1'
				: 'disabled',
			_FISH_COMPLETION_TEMP_DIR: temporaryDirectory,
			_FISH_COMPLETION_WORKER: fileURLToPath(
				new URL('worker.fish', import.meta.url),
			),
			/* eslint-enable @typescript-eslint/naming-convention */
		},
		timeout: options.timeout ?? 10_000,
		signal: options.signal!,
	});

	return {
		child,
		inputChannel: child.stdin!,
		outputChannel: (child.stdio as Readable[])[9]!,
	};
}

function getCommand(fishPath: string): [string, ...string[]] {
	switch (platform) {
		case 'android':
		case 'linux':
		case 'netbsd': {
			return [
				'script',
				'-e',
				'-q',
				'-c',
				`${fishPath} -iPC 'source $_FISH_COMPLETION_WORKER'`,
				'/dev/null',
			];
		}

		case 'darwin':
		case 'freebsd': {
			return [
				'script',
				'-q',
				'/dev/null',
				fishPath,
				'-iPC',
				'source $_FISH_COMPLETION_WORKER',
			];
		}

		case 'aix':
		case 'openbsd':
		case 'sunos':
		case 'win32': {
			throw new Error(`Unsupported platform: ${platform}`);
		}

		default: {
			throw new Error(`Unknown platform: ${platform}`);
		}
	}
}

export function checkPlatformSupport() {
	try {
		getCommand('fish');
		return undefined;
	} catch (error) {
		return (error as Error).message;
	}
}

export function debugStdOutputAndError(
	child: ExecaChildProcess,
	output: vscode.LogOutputChannel,
) {
	for (const channel of ['stdout', 'stderr'] as const) {
		const rl = createInterface(child[channel]!);

		rl.on('line', (line) => {
			output.trace(channel + ': ' + line);
		});

		rl.resume();
	}
}

import {platform} from 'node:process';
import {createInterface} from 'node:readline';
import type {Readable} from 'node:stream';
import {fileURLToPath} from 'node:url';
import {execa} from 'execa';
import {type LogOutputChannel} from 'vscode';
import {temporaryDirectory} from '../utils/fs.js';

export async function* startWorker(options: {
	cwd: string;
	fishPath: string;
	keyBind: string;
	isAssistantEnabled?: boolean | undefined;
	signal?: AbortSignal | undefined;
	timeout?: number | undefined;
	output?: LogOutputChannel | undefined;
}): AsyncGenerator<string, void, string | undefined> {
	options.fishPath ||= 'fish';
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
			_FISH_COMPLETION_FISH: options.fishPath,
			/* eslint-enable @typescript-eslint/naming-convention */
		},
		timeout: options.timeout ?? 10_000,
		signal: options.signal!,
	});

	if (options.output) {
		const {output} = options;

		output.trace('Execute: ' + JSON.stringify(command));

		for (const channel of ['stdout', 'stderr'] as const) {
			const rl = createInterface(child[channel]!);

			rl.on('line', (line) => {
				output.trace(channel + ': ' + line);
			});

			rl.resume();
		}
	}

	const rl = createInterface({
		input: (child.stdio as Readable[])[9]!,
		prompt: '',
		signal: options.signal,
	});

	try {
		let ready = false;

		for await (const line of rl) {
			if (!line.trim()) continue;
			options.output?.trace('Line: ' + line);

			if (ready) {
				yield line;
			} else if (line.includes('ready')) {
				options.output?.trace('stdin: ' + options.keyBind);
				child.stdin!.write(options.keyBind);
				ready = true;
			}
		}

		await child;
		options.output?.info('Done');
	} finally {
		child.kill();
	}
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
				`"$_FISH_COMPLETION_FISH" -iPC 'source $_FISH_COMPLETION_WORKER'`,
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

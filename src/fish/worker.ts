import {platform} from 'node:process';
import {createInterface} from 'node:readline';
import type {Readable} from 'node:stream';
import {join} from 'node:path';
import {execa} from 'execa';
import {type LogOutputChannel} from 'vscode';
import {temporaryDirectory} from '../utils/fs.js';
import {inspect} from '../utils/inspect.js';

const stdio = [
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
] as const;

const commonEnv = {
	/* eslint-disable @typescript-eslint/naming-convention */
	TERM: 'dumb',
	CHROME_DESKTOP: undefined,
	EDITOR: undefined,
	GIO_LAUNCHED_DESKTOP_FILE: undefined,
	GIT_ASKPASS: undefined,
	TERM_PROGRAM: undefined,
	VISUAL: undefined,
	VSCODE_GIT_ASKPASS_EXTRA_ARGS: undefined,
	VSCODE_GIT_ASKPASS_MAIN: undefined,
	VSCODE_GIT_ASKPASS_NODE: undefined,
	VSCODE_GIT_IPC_HANDLE: undefined,
	_FISH_COMPLETION_TEMP_DIR: temporaryDirectory,
	_FISH_COMPLETION_WORKER: join(__dirname, 'worker.fish'),
	/* eslint-enable @typescript-eslint/naming-convention */
} as const;

const defaultFishPath = 'fish';
const defaultTimeout = 10_000;
let lastId = 0;

export async function* startWorker(options: {
	readonly cwd: string;
	readonly fishPath: string;
	readonly keyBind: string;
	readonly isAssistantEnabled?: boolean | undefined;
	readonly signal?: AbortSignal | undefined;
	readonly timeout?: number | undefined;
	readonly output?: LogOutputChannel | undefined;
}) {
	const id = ++lastId;
	const fishPath = options.fishPath || defaultFishPath;
	const command = getCommand(fishPath);

	const child = execa(command[0], command.slice(1), {
		stdio,
		cwd: options.cwd,
		env: {
			...commonEnv,
			/* eslint-disable @typescript-eslint/naming-convention */
			_FISH_COMPLETION_ASSIST: options.isAssistantEnabled
				? 'v1'
				: 'disabled',
			_FISH_COMPLETION_FISH: fishPath,
			/* eslint-enable @typescript-eslint/naming-convention */
		},
		timeout: options.timeout ?? defaultTimeout,
		signal: options.signal!,
	});

	if (options.output) {
		const {output} = options;

		output.info(`[${id}] Started`);
		output.debug(
			`[${id}] Options: ${inspect({...options, output: Boolean(options.output), command, fishPath})}`,
		);

		for (const channel of ['stdout', 'stderr'] as const) {
			const rl = createInterface(child[channel]);

			rl.on('line', (line) => {
				output.trace(`[${id}] ${channel}: ${line}`);
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
			options.output?.trace(`[${id}] Line: ${line}`);

			if (ready) {
				yield line;
			} else if (line.includes('ready')) {
				options.output?.trace(`[${id}] stdin: ${options.keyBind}`);
				child.stdin.write(options.keyBind);
				ready = true;
			}
		}

		await child;
		options.output?.debug(`[${id}] Done`);
	} catch (error) {
		options.output?.error(`[${id}] Failed: ${inspect(error)}`);
		throw error;
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

export function checkPlatformSupport(output?: LogOutputChannel) {
	try {
		output?.info(`Platform: ${platform}`);
		getCommand('fish');
		return undefined;
	} catch (error) {
		output?.error(`Cannot activate: ${inspect(error)}`);
		return String(error);
	}
}

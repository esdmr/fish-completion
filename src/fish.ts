import {createInterface} from 'node:readline';
import {fileURLToPath} from 'node:url';
import {writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {mkdtempSync} from 'node:fs';
import {execa} from 'execa';
import type {OutputChannel} from 'vscode';

export const temporaryDir = mkdtempSync(join(tmpdir(), 'fish-completion-'));

const fishScript = `fish -iPC 'set -g _vscode_dir (string unescape --style url -- "${encodeURIComponent(temporaryDir)}"); source (string unescape --style url -- "${encodeURIComponent(fileURLToPath(new URL('worker.fish', import.meta.url)))}")'`;

export async function completeCommand(options: {
	cwd: string;
	text: string;
	output: OutputChannel;
	signal: AbortSignal;
}) {
	await writeFile(join(temporaryDir, 'text'), options.text, 'utf8');

	let currentToken = '';
	const completions: string[] = [];

	const child = execa('script', ['-e', '-q', '-c', fishScript, '/dev/null'], {
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
			/* eslint-enable @typescript-eslint/naming-convention */
		},
		timeout: 10_000,
		signal: options.signal,
	});
	const rl = createInterface((child.stdio as any[])[9]);

	options.output.appendLine('Request: ' + options.text.slice(options.text.lastIndexOf('\n') + 1));

	rl.on('line', line => {
		options.output.appendLine('Line: ' + line);
		if (line.includes('ready')) {
			child.stdin!.write('e');
		} else if (line.startsWith('complete ')) {
			completions.push(line.slice('complete '.length));
		} else if (line.startsWith('current ')) {
			currentToken = line.slice('current '.length);
		}
	});

	rl.resume();

	for (const channel of ['stdout', 'stderr'] as const) {
		const rl = createInterface(child[channel]!);

		rl.on('line', line => {
			options.output.appendLine(channel + ': ' + line);
		});

		rl.resume();
	}

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

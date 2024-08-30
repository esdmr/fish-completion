import {ProgressLocation, commands, window} from 'vscode';
import {isAbortError, vscodeAbortController} from '../utils/abort.js';
import {getFishPath} from '../utils/config.js';
import {disposables} from '../utils/disposables.js';
import {updateCompletions} from '../fish/update-completions.js';
import {output} from '../utils/output.js';
import {Message} from '../utils/message.js';
import {inspect} from '../utils/inspect.js';

const failureMessage = new Message(
	'error',
	'Something gone wrong while updating fish completions',
);

const command: Parameters<typeof window.withProgress>[1] = async (
	progress,
	token,
) => {
	let abort;

	try {
		if (token.isCancellationRequested) {
			return;
		}

		abort = vscodeAbortController(token);

		progress.report({
			increment: 0,
		});

		let currentProgress = 0;

		for await (const state of updateCompletions({
			fishPath: getFishPath(),
			output,
			signal: abort.signal,
		})) {
			const percentage = (state.progress / state.total) * 100;
			const increment = Math.max(percentage - currentProgress, 0);

			progress.report({
				increment,
				message: `${state.progress}/${state.total} - ${state.current}`,
			});

			currentProgress = percentage;
		}
	} catch (error) {
		if (isAbortError(error)) return;
		void failureMessage.show(inspect(error));
		throw error;
	} finally {
		abort?.dispose();
	}
};

export function registerUpdateCompletionsCommand() {
	disposables.add(
		commands.registerCommand(
			'fish-completion.fish_update_completions',
			() =>
				window.withProgress(
					{
						location: ProgressLocation.Notification,
						cancellable: true,
						title: 'Updating fish completions',
					},
					command,
				),
		),
	);
}

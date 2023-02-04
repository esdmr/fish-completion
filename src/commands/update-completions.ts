import vscode from 'vscode';
import {vscodeAbortController} from '../abort.js';
import {getFishPath} from '../config.js';
import {disposables} from '../disposables.js';
import {updateCompletions} from '../fish/update-completions.js';
import {output} from '../output.js';

const command: Parameters<typeof vscode.window.withProgress>[1] = async (
	progress,
	token,
) => {
	if (token.isCancellationRequested) {
		return;
	}

	const {signal, dispose} = vscodeAbortController(token);

	progress.report({
		increment: 0,
	});

	let currentProgress = 0;

	try {
		await updateCompletions({
			fishPath: getFishPath(),
			signal,
			callback(state) {
				const percentage = (state.progress / state.total) * 100;
				const increment = Math.max(percentage - currentProgress, 0);

				progress.report({
					increment,
					message: `${state.progress}/${state.total} - ${state.current}`,
				});

				currentProgress += increment;
			},
		});
	} catch (error) {
		const string = String(error);

		if (string.includes('AbortError')) {
			output.appendLine('Aborted');
			return;
		}

		output.appendLine('Error: ' + string);

		void vscode.window.showErrorMessage(
			'Something gone wrong while updating fish completions.',
		);
	} finally {
		dispose();
	}
};

export function registerUpdateCompletionsCommand() {
	disposables.add(
		vscode.commands.registerCommand(
			'fish-completion.fish_update_completions',
			() =>
				vscode.window.withProgress(
					{
						location: vscode.ProgressLocation.Notification,
						cancellable: true,
						title: 'Updating fish completions',
					},
					command,
				),
		),
	);
}

import vscode from 'vscode';
import {vscodeAbortController} from '../abort.js';
import {disposables} from '../disposables.js';
import {updateCompletions} from '../fish/update-completions.js';
import {output} from '../output.js';

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
					async (progress, token) => {
						const {signal, dispose} = vscodeAbortController(token);

						progress.report({
							increment: 0,
						});

						let currentProgress = 0;

						try {
							await updateCompletions({
								signal,
								callback(state) {
									const percentage =
										(state.progress / state.total) * 100;

									progress.report({
										increment: percentage - currentProgress,
										message: `${state.progress}/${state.total} - ${state.current}`,
									});

									currentProgress = percentage;
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
					},
				),
		),
	);
}

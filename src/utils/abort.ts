import type {CancellationToken} from 'vscode';

export function vscodeAbortController(token: CancellationToken) {
	const controller = new AbortController();
	const subscription = token.onCancellationRequested((error) => {
		controller.abort(error);
		subscription.dispose();
	});

	if (token.isCancellationRequested) {
		controller.abort();
		subscription.dispose();
	}

	return {
		signal: controller.signal,
		dispose() {
			subscription.dispose();
		},
	};
}

export function isAbortError(
	error: unknown,
): error is DOMException & {name: 'AbortError'} {
	return error instanceof DOMException && error.name === 'AbortError';
}

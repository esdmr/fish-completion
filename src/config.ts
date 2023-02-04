import vscode from 'vscode';

function getConfig(scope?: vscode.ConfigurationScope) {
	return vscode.workspace.getConfiguration('fish-completion', scope);
}

export function getFishPath(scope?: vscode.ConfigurationScope) {
	return getConfig(scope).get<string>('path.fish') ?? '';
}

import {workspace, type ConfigurationScope} from 'vscode';

function getConfig(scope?: ConfigurationScope) {
	return workspace.getConfiguration('fish-completion', scope);
}

export function getFishPath(scope?: ConfigurationScope) {
	return getConfig(scope).get<string>('path.fish') ?? '';
}

export function isAssistantEnabled(scope?: ConfigurationScope) {
	return getConfig(scope).get<boolean>('assistant.v1.enabled') ?? false;
}

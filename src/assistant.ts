import vscode from 'vscode';
import {
	functionExcludeList,
	variableExcludeList,
} from './assistant-exclude-list.js';
import {disposables} from './disposables.js';

function getEndOfLine(eol: vscode.EndOfLine) {
	switch (eol) {
		case vscode.EndOfLine.LF: {
			return '\n';
		}

		case vscode.EndOfLine.CRLF: {
			return '\r\n';
		}
	}
}

// The name is marked as optional to avoid backtracking.
const variablePattern = /^\s*set\s+(?:-[^\s&|<>;()]*\s+)*(?<name>\w+)?/;
const functionPattern =
	/^\s*function\s+(?:-[^\s&|<>;()]*\s+)*(?<name>[\w[\].+-]+)?/;

class AssistantResult {
	version = 0;
	readonly functions = new Set<string>();
	readonly variables = new Set<string>();

	getCommands() {
		return [
			...[...this.functions].map(
				(name) => `function ${name} -d 'detected function';end`,
			),
			...[...this.variables].map((name) => `set -g ${name}`),
		].join('\n');
	}

	update(document: vscode.TextDocument) {
		this.version = document.version;
		this.functions.clear();
		this.variables.clear();

		const lines = document.getText().split(getEndOfLine(document.eol));

		for (const line of lines) {
			const functionName = functionPattern.exec(line)?.groups!.name;

			if (functionName && !functionExcludeList.has(functionName)) {
				this.functions.add(functionName);
				continue;
			}

			const variableName = variablePattern.exec(line)?.groups!.name;

			if (variableName && !variableExcludeList.has(variableName)) {
				this.variables.add(variableName);
				continue;
			}
		}

		return this;
	}
}

const cache = new Map<vscode.TextDocument, AssistantResult>();

disposables.add(
	new vscode.Disposable(() => {
		cache.clear();
	}),
);

function fixCache() {
	const invalidKeys = [];

	for (const key of cache.keys()) {
		if (key.isClosed) {
			invalidKeys.push(key);
		}
	}

	for (const key of invalidKeys) {
		cache.delete(key);
	}
}

export function getAssistantResult(
	document: vscode.TextDocument,
): AssistantResult {
	fixCache();

	const cached = cache.get(document);

	if (cached?.version === document.version) {
		return cached;
	}

	return (cached ?? new AssistantResult()).update(document);
}

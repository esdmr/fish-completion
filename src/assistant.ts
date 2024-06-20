import {Disposable, EndOfLine, type TextDocument} from 'vscode';
import {
	functionExcludeList,
	variableExcludeList,
} from './assistant-exclude-list.js';
import {disposables} from './utils/disposables.js';

function getEndOfLine(eol: EndOfLine) {
	switch (eol) {
		case EndOfLine.LF: {
			return '\n';
		}

		case EndOfLine.CRLF: {
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

	update(document: TextDocument) {
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

const cache = new Map<TextDocument, AssistantResult>();

disposables.add(
	new Disposable(() => {
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

export function getAssistantResult(document: TextDocument): AssistantResult {
	fixCache();

	const cached = cache.get(document);

	if (cached?.version === document.version) {
		return cached;
	}

	const updated = (cached ?? new AssistantResult()).update(document);
	cache.set(document, updated);
	return updated;
}

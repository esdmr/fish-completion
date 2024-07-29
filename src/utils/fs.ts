import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Disposable} from 'vscode';
import {disposables} from './disposables.js';

export const temporaryDirectory = mkdtempSync(
	join(tmpdir(), 'fish-completion-'),
);

disposables.add(
	new Disposable(() => {
		rmSync(temporaryDirectory, {force: true, recursive: true});
	}),
);

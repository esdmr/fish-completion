import {window} from 'vscode';
import {disposables} from './disposables.js';

export const output = window.createOutputChannel('Fish Completion', {
	log: true,
});
disposables.add(output);

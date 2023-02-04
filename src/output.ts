import vscode from 'vscode';
import {disposables} from './disposables.js';

export const output = vscode.window.createOutputChannel('Fish Completion');
disposables.add(output);

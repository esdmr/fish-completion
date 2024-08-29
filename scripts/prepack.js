#!/usr/bin/env node
import fs from 'node:fs/promises';
import process from 'node:process';
import {execa as execa_} from 'execa';

/**
 * @param {Record<string, any>} packageMeta
 */
function processPackageJson(packageMeta) {
	// Cleanup package.json
	delete packageMeta.type;
	delete packageMeta.scripts;
	delete packageMeta.devDependencies;
	delete packageMeta.engines.node;
	delete packageMeta.engines.pnpm;
	delete packageMeta.packageManager;
	delete packageMeta.pnpm;

	return packageMeta;
}

const execa = execa_({
	stdio: 'inherit',
});

console.log('pnpm install');
await execa`pnpm install --prod=false`;

console.log('pnpm run build');
await execa`pnpm run build`;

console.log('pnpm run lint');
await execa`pnpm run lint`;

console.log('pnpm run type-check');
await execa`pnpm run type-check`;

const packageJson = await fs.readFile('package.json', 'utf8');
const newPackageJson = JSON.stringify(
	processPackageJson(JSON.parse(packageJson)),
);

try {
	console.log('mv package.json …');
	await fs.rename('package.json', '.package.dev.json');

	console.log('new package.json');
	await fs.writeFile('package.json', newPackageJson);
} catch (error) {
	console.error(error);

	console.error('# Reverting changes to package.json');
	await fs.writeFile('package.json', packageJson);

	console.error('rm …');
	await fs.rm('.package.dev.json', {force: true});

	process.exit(1);
}

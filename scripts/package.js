#!/usr/bin/env node
import {execaCommand} from 'execa';

/** @type {import('execa').Options} */
const options = {
	stdio: 'inherit',
};

await execaCommand('node scripts/prepack.js', options);

try {
	await execaCommand('pnpm exec vsce package --no-dependencies', options);
} finally {
	await execaCommand('node scripts/postpack.js', options);
}

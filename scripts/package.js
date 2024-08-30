#!/usr/bin/env node
import process from 'node:process';
import {execa as execa_} from 'execa';

const execa = execa_({
	stdio: 'inherit',
});

await execa`node scripts/prepack.js`;

try {
	await execa`pnpm exec vsce package --no-dependencies ${process.argv.slice(2)}`;
} finally {
	await execa`node scripts/postpack.js`;
}

#!/usr/bin/env node
import {execa as execa_} from 'execa';

const execa = execa_({
	stdio: 'inherit',
});

await execa`node scripts/prepack.js`;

try {
	await execa`pnpm exec vsce package --no-dependencies`;
} finally {
	await execa`node scripts/postpack.js`;
}

#!/usr/bin/env node
import fs from 'node:fs/promises';

console.log('rm package.json');
await fs.unlink('package.json');

console.log('mv … package.json');
await fs.rename('.package.dev.json', 'package.json');

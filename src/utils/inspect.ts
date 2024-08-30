import {inspect as inspect_} from 'node:util';

export const inspect = (value: unknown) =>
	inspect_(value, {
		depth: 10,
		numericSeparator: true,
	});

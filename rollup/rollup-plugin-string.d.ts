declare module 'rollup-plugin-string' {
	// eslint-disable-next-line import/no-extraneous-dependencies
	import type {Plugin} from 'rollup';

	export type Options = {
		include: string;
		exclude?: string[];
	};

	export function string(options: Options): Plugin;
}

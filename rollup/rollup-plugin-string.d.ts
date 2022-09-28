declare module 'rollup-plugin-string' {
	import type {Plugin} from 'rollup';

	export type Options = {
		include: string;
		exclude?: string[];
	};

	export function string(options: Options): Plugin;
}

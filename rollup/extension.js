import process from 'node:process';
import esbuild from 'rollup-plugin-esbuild';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import {string} from 'rollup-plugin-string';

export const isProduction = process.env.NODE_ENV === 'production';

/** @type {import('rollup').RollupOptions} */
const config = {
	strictDeprecations: true,
	plugins: [
		string({
			include: '**/*.fish',
		}),
		// `.ts` files may import other `.ts` files via a `.js` extension. It
		// should resolve them.
		nodeResolve({
			// `node-resolve` does not operate on `.ts` files by default.
			extensions: ['.ts', '.mjs', '.js', '.json', '.node'],
			preferBuiltins: true,
		}),
		commonjs(),
		{
			name: 'removeNodePrefix',
			resolveId(source) {
				if (source.startsWith('node:')) {
					return {
						id: source.slice('node:'.length),
						external: true,
					};
				}

				return null;
			},
		},
		// It should format/minify.
		esbuild({
			minify: isProduction,
			target: 'es2020',
		}),
	],
	input: 'src/index.ts',
	output: {
		file: 'resources/extension.js',
		format: 'cjs',
		compact: isProduction,
		generatedCode: 'es2015',
		interop: 'auto',
		sourcemap: true,
	},
	external: 'vscode',
};

export default config;

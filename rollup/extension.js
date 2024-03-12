import process from 'node:process';
import esbuild from 'rollup-plugin-esbuild';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import {defineConfig} from 'rollup';

export const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
	strictDeprecations: true,
	input: 'src/index.ts',
	output: {
		file: 'resources/extension.js',
		format: 'cjs',
	},
	external: 'vscode',
	plugins: [
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
		nodeResolve({
			extensions: ['.ts', '.mjs', '.js', '.json', '.node'],
			preferBuiltins: true,
		}),
		esbuild({
			minify: isProduction,
			target: 'esnext',
		}),
		commonjs({
			extensions: ['.ts', '.mjs', '.js', '.json', '.node'],
		}),
	],
});

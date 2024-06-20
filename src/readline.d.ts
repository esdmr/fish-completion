declare module 'readline' {
	// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
	export interface ReadLineOptions {
		signal?: AbortSignal | undefined;
	}
}

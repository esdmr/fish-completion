// eslint-disable-next-line @typescript-eslint/ban-types
export function allSettledAggregate<T extends readonly unknown[] | []>(
	values: T,
): Promise<{-readonly [P in keyof T]: Awaited<T[P]>}>;

export function allSettledAggregate<T>(
	values: Iterable<T | PromiseLike<T>>,
): Promise<Array<Awaited<T>>>;

export async function allSettledAggregate(values: Iterable<unknown>) {
	const results = await Promise.allSettled(values);

	const rejects = results
		.filter((i) => i.status === 'rejected')
		.map<unknown>((i) => i.reason);

	if (rejects.length > 0) {
		throw new AggregateError(rejects, 'Promise.allSettledResolved failed');
	}

	return results;
}

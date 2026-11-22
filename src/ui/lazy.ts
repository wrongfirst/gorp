/**
 * Memoizes a dynamic module import and clears the cache if the load rejects,
 * allowing subsequent attempts to retry after transient network failures.
 */
export function createLazyLoader<T>(load: () => Promise<T>): () => Promise<T> {
    let promise: Promise<T> | null = null;
    return () => {
        if (!promise) {
            promise = load().catch((err) => {
                promise = null;
                throw err;
            });
        }
        return promise;
    };
}

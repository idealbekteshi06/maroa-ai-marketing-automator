/**
 * Wraps a Supabase query function with retry logic.
 * If the first call returns null/empty, waits `delay`ms and retries once.
 */
export async function queryWithRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  retries = 1,
  delay = 2000
): Promise<{ data: T | null; error: any }> {
  const result = await queryFn();
  if (result.error) {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, delay));
      return queryWithRetry(queryFn, retries - 1, delay);
    }
    return result;
  }
  const isEmpty =
    result.data === null ||
    result.data === undefined ||
    (Array.isArray(result.data) && result.data.length === 0);
  if (isEmpty && retries > 0) {
    await new Promise((r) => setTimeout(r, delay));
    return queryWithRetry(queryFn, retries - 1, delay);
  }
  return result;
}

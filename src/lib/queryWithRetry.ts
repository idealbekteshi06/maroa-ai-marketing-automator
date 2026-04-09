/**
 * Wraps a Supabase query function — retries only on errors, NOT on empty results.
 */
export async function queryWithRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: unknown }>,
  retries = 1,
  delay = 1000
): Promise<{ data: T | null; error: unknown }> {
  const result = await queryFn();
  if (result.error && retries > 0) {
    await new Promise((r) => setTimeout(r, delay));
    return queryWithRetry(queryFn, retries - 1, delay);
  }
  return result;
}

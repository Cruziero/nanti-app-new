export async function readAllExportPages<T>(
  fetchPage: (
    from: number,
    to: number,
  ) => PromiseLike<{
    data: T[] | null;
    error: unknown;
  }>,
) {
  const rows: T[] = [];
  const pageSize = 500;
  for (;;) {
    const { data, error } = await fetchPage(rows.length, rows.length + pageSize - 1);
    if (error) throw error;
    if (!data) throw new Error("Account export returned no data.");
    if (data.length === 0) return { data: rows, error: null };
    rows.push(...data);
  }
}

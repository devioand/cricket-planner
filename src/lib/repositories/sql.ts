/**
 * Build the VALUES clause for a multi-row INSERT with correct, sequential
 * parameter placeholders. Given rows of value arrays, returns the
 * `($1, $2), ($3, $4), …` string and the flattened params in matching order.
 *
 * Only numbered placeholders are interpolated into SQL — every actual value
 * goes through the params array, so this is injection-safe. Returns empty
 * placeholders for no rows (callers skip the query in that case).
 */
export function buildValues(rows: unknown[][]): {
  placeholders: string;
  params: unknown[];
} {
  const params: unknown[] = [];
  const groups = rows.map((values) => {
    const start = params.length;
    params.push(...values);
    return `(${values.map((_, i) => `$${start + i + 1}`).join(", ")})`;
  });
  return { placeholders: groups.join(", "), params };
}

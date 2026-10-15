/** Small helpers shared by the query layer. */

export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Escape SQL LIKE wildcards in user-provided search text.
 * Use with `... LIKE ? ESCAPE '\'`.
 */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (m) => `\\${m}`);
}

// Route params matched against `(\d+)` are guaranteed all-digit, but an
// attacker can still send an arbitrarily long digit string that overflows
// Postgres's 32-bit int4 primary keys. Passing that straight to Prisma
// throws a validation error instead of a clean 404, so callers must check
// the range before querying.
const MAX_INT4 = 2147483647;

export function parseId(raw: string): number | null {
  const id = parseInt(raw, 10);
  if (!Number.isSafeInteger(id) || id < 1 || id > MAX_INT4) {
    return null;
  }
  return id;
}

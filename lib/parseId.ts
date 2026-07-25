// Numeric ids from route params or form fields are attacker-controlled
// strings. An arbitrarily long digit string overflows Postgres's 32-bit
// int4 primary keys and Prisma throws a validation error instead of a
// clean "not found" — callers must check the range before querying.
const MAX_INT4 = 2147483647;

export function parseId(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  const id = typeof raw === "number" ? raw : parseInt(raw, 10);
  if (!Number.isSafeInteger(id) || id < 1 || id > MAX_INT4) {
    return null;
  }
  return id;
}

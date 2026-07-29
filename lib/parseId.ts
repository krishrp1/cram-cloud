// Numeric ids from route params or form fields are attacker-controlled
// strings. An arbitrarily long digit string overflows Postgres's 32-bit
// int4 primary keys and Prisma throws a validation error instead of a
// clean "not found" — callers must check the range before querying.
const MAX_INT4 = 2147483647;

export function parseId(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  // parseInt truncates at the first non-digit ("12abc" -> 12, "1.5" -> 1)
  // instead of rejecting the whole string — reject anything that isn't
  // purely digits before it ever reaches parseInt.
  if (typeof raw === "string" && !/^\d+$/.test(raw)) return null;
  const id = typeof raw === "number" ? raw : parseInt(raw, 10);
  if (!Number.isSafeInteger(id) || id < 1 || id > MAX_INT4) {
    return null;
  }
  return id;
}

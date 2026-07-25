import { z } from "zod";
import { SEMESTERS } from "@/lib/constants";

// Deliberately loose — the original API never verified email ownership
// (no confirmation email is sent), so a stricter RFC-grade check would
// only add friction without adding real validation value. Matches the
// original backend's EMAIL_RE exactly.
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MAX_EMAIL_LENGTH = 254; // RFC 5321 4.5.3.1.3
const MIN_PASSWORD_LENGTH = 8;
// bcrypt only reads the first 72 bytes of its input — anything past that
// is silently ignored, so two different passwords sharing a 72-byte
// prefix would hash identically. Reject before that happens.
const MAX_PASSWORD_BYTES = 72;

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(MAX_EMAIL_LENGTH, "Invalid email address")
  .regex(EMAIL_RE, "Invalid email address");

const semester = z.enum(SEMESTERS as [string, ...string[]], { error: "Invalid semester" });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Email and password required"),
  password: z.string().min(1, "Email and password required"),
});

export const registerSchema = z.object({
  email,
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
    .refine(
      (val) => Buffer.byteLength(val, "utf8") <= MAX_PASSWORD_BYTES,
      `Password must be at most ${MAX_PASSWORD_BYTES} bytes`
    ),
  semester,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

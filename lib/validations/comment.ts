import { z } from "zod";

const MAX_COMMENT_LENGTH = 2000;

export const commentSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Text required")
    .max(MAX_COMMENT_LENGTH, `Comment too long (max ${MAX_COMMENT_LENGTH} characters)`),
});

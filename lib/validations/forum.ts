import { z } from "zod";

const MAX_TITLE_LENGTH = 255;
const MAX_CONTENT_LENGTH = 10000;

export const createThreadSchema = z.object({
  title: z.string().trim().min(1, "Title and content required").max(MAX_TITLE_LENGTH, `Title too long (max ${MAX_TITLE_LENGTH} characters)`),
  content: z.string().trim().min(1, "Title and content required").max(MAX_CONTENT_LENGTH, `Content too long (max ${MAX_CONTENT_LENGTH} characters)`),
});

export const replyContentSchema = z.object({
  content: z.string().trim().min(1, "Content required").max(MAX_CONTENT_LENGTH, `Content too long (max ${MAX_CONTENT_LENGTH} characters)`),
});
